import { LvtDomain, LvtSpanType, SpanWithDomainEx } from '@lvt/telemetry';
import { OpenAI } from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources';

import { Logger } from '@/logger';
import { SPAN_WITH_DOMAIN_OPTIONS } from '@/utilities/decorators';
import { InternalError, ServiceUnavailableError } from '@/errors/httpErrors';

const SYSTEM_PROMPT = `
  You are evaluating whether an image matches a user's search phrase for an image search engine.

  Your task is to estimate how likely a typical user would agree that the image satisfies the search phrase.

  Consider the search phrase as a whole. Do not decompose it into separate concepts or perform partial scoring.

  Base your judgment only on what is visible in the image. Do not assume objects or events that are not clearly supported by the image.

  Return your confidence that the image satisfies the search phrase.

	Do not infer objects that are not visible.`
  .replace(/^\s+/gm, '')
  .trim();

const STRUCTURED_OUTPUTS = {
  "type": "object",
  "properties": {
    "confidence": {
      "type": "number",
      "minimum": 0,
      "maximum": 1,
      "description": "Confidence that a typical user would consider this image a match for the search phrase."
    },
    "reason": {
      "type": "string",
      "description": "A brief explanation."
    }
  },
  "required": ["confidence", "reason"],
  "additionalProperties": false
};

interface Evaluation {
  confidence: number;
  reason: string;
}

function isEvaluation(value: any): value is Evaluation {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof value.confidence === 'number' &&
    typeof value.reason === 'string'
  );
}

export class OpenAIDetectionService {
  private readonly logger = new Logger(OpenAIDetectionService.name);
  private readonly openai: OpenAI;
  private readonly openaiModel: string;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 12000,
    });
    this.openaiModel = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';
  }

  @SpanWithDomainEx({
    type: LvtSpanType.REST_REQUEST,
    domain: LvtDomain.AI_TALKDOWN,
    options: SPAN_WITH_DOMAIN_OPTIONS,
  })
  public async querySearchPhrase(searchPhrase: string, image: Buffer): Promise<Evaluation> {
    const searchQuery = `
      Search phrase:

      ${searchPhrase}

      Evaluate the attached image.`
      .replace(/^\s+/gm, '')
      .trim();

    const prompt: Array<ChatCompletionMessageParam> = [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: searchQuery,
          },
          {
            type: 'image_url' as const,
            image_url: { url: `data:image/jpeg;base64,${image.toString('base64')}` },
          },
        ],
      },
    ];
    try {
      const completion = await this.openai.chat.completions.create({
        model: this.openaiModel,
        messages: prompt,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'image_search_evaluation',
            schema: STRUCTURED_OUTPUTS,
            strict: true,
          },
        }
      });

      if (
        !completion.choices ||
        completion.choices.length < 1 ||
        !completion.choices[0]?.message.content
      ) {
        throw new ServiceUnavailableError(`unexpected openai response: ${completion.id}`);
      }
      const content = completion.choices[0].message.content;
      const rsp = JSON.parse(content);
      if (!isEvaluation(rsp)) {
        throw new InternalError(`unexpected openai response: ${content}`);
      }
      return rsp;

    } catch (err) {
      throw new ServiceUnavailableError('failure calling OpenAI', { cause: err });
    }
  }
}
