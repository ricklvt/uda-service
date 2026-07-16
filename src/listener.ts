import {
  MQTT_WILDCARD_SINGLE_LEVEL,
  MqttClient,
  MqttRpcClient,
  extractRoutingUuidFromTopic,
} from '@lvt/mqtt/node';
import * as genaipb from '@lvt/protobufs/lvt/legacy_security_events/v1/gen_ai_pb';

import { getLogger } from '@/logger';
import { OpenAIDetectionService } from '@/services/openai.service';

const logger = getLogger('uda-request-listener');
const MATCH_MIN_CONFIDENCE = Number.parseFloat(process.env.MATCH_MIN_CONFIDENCE ?? '0.6');

/**
 * Listens over MQTT for the AI Talkdown audio-generation requests that the
 * mediator service handles (GenerateAlertAudioCloudService.generateAudio, one per
 * liveunit). For now it just decodes the protobuf request and logs its contents.
 */
export class UDARequestListener {
  private mqttClient?: MqttClient;
  private rpcClient?: MqttRpcClient;
  private detector: OpenAIDetectionService;

  public constructor() {
    this.detector = new OpenAIDetectionService();
  }

  public async start(): Promise<void> {
    this.mqttClient = await MqttClient.createMqttClient();
    await this.mqttClient.connect();
    await this.mqttClient.onConnected();

    this.rpcClient = new MqttRpcClient(this.mqttClient);
    await this.rpcClient.listenForRequest(
      genaipb.GenerateAlertAudioCloudService.method.generateAudio,
      { liveunitUuid: MQTT_WILDCARD_SINGLE_LEVEL },
      (topic: string, req: genaipb.GenerateAudioRequest) => this.handleRequest(topic, req),
    );

    logger.notice('AI Audio request listener started');
  }

  public async stop(): Promise<void> {
    await this.mqttClient?.end();
    logger.notice('AI Audio request listener stopped');
  }

  private async handleRequest(topic: string, req: genaipb.GenerateAudioRequest): Promise<void> {
    try {
      const liveunitUuid = extractRoutingUuidFromTopic(topic);
      logger.info('received pre-alert image', {
        topic,
        liveunitUuid,
        requestUuid: req.requestUuid,
        eventUuid: req.eventUuid,
        detectionCameraUuid: req.detectionCameraUuid,
      });

      const ans = await this.detector.querySearchPhrase('white truck or a bicycle', Buffer.from(req.cameraSnapshot));
      logger.info('OpenAI detection result', {
        liveunitUuid,
        requestUuid: req.requestUuid,
        eventUuid: req.eventUuid,
        openaiResult: ans,
      });
      logger.info(`interpreting this image as a ${ans.confidence >= MATCH_MIN_CONFIDENCE ? 'match' : 'non-match'}`);
    } catch (err) {
      while (err instanceof Error && err.cause) {
        err = err.cause;
      }
      logger.error('failed to handle UDA request', {
        topic,
        requestUuid: req.requestUuid,
        eventUuid: req.eventUuid,
        detectionCameraUuid: req.detectionCameraUuid,
        error: err,
      });
    }
  }
}
