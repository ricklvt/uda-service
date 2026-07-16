import { afterEach, describe, expect, it } from 'vitest';
import { getOpenAIClient } from './openai.ts';

describe('getOpenAIClient', () => {
  const original = process.env.OPENAI_API_KEY;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.OPENAI_API_KEY;
    } else {
      process.env.OPENAI_API_KEY = original;
    }
  });

  it('throws when OPENAI_API_KEY is missing', () => {
    // Arrange
    delete process.env.OPENAI_API_KEY;

    // Act + Assert
    expect(() => getOpenAIClient()).toThrow('OPENAI_API_KEY is undefined.');
  });
});
