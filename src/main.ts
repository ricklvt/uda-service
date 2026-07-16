import { UDARequestListener } from './listener';
import { getLogger } from './logger';

const logger = getLogger('main');

async function main(): Promise<void> {
  logger.info('uda-service starting', { node: process.version });

  const listener = new UDARequestListener();
  await listener.start();

  logger.info('uda-service started');
}

main().catch((err: unknown) => {
  logger.logThrown('fatal error during startup', err);
  process.exit(1);
});
