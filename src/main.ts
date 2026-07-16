import { getLogger } from './logger.ts';

const logger = getLogger('main');

function main(): void {
  logger.info('uda-service starting', { node: process.version });
  // TODO: wire up the service (HTTP / gRPC / worker) here.
  logger.info('uda-service started');
}

main();
