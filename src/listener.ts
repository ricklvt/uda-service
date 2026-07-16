import {
  MQTT_WILDCARD_SINGLE_LEVEL,
  MqttClient,
  MqttRpcClient,
  extractRoutingUuidFromTopic,
} from '@lvt/mqtt/node';
import * as genaipb from '@lvt/protobufs/lvt/legacy_security_events/v1/gen_ai_pb';

import { getLogger } from './logger';

const logger = getLogger('uda-request-listener');

/**
 * Listens over MQTT for the AI Talkdown audio-generation requests that the
 * mediator service handles (GenerateAlertAudioCloudService.generateAudio, one per
 * liveunit). For now it just decodes the protobuf request and logs its contents.
 */
export class UDARequestListener {
  private mqttClient?: MqttClient;
  private rpcClient?: MqttRpcClient;

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

  private handleRequest(topic: string, req: genaipb.GenerateAudioRequest): void {
    const liveunitUuid = extractRoutingUuidFromTopic(topic);
    logger.info('received pre-alert image', {
      topic,
      liveunitUuid,
      requestUuid: req.requestUuid,
      eventUuid: req.eventUuid,
      detectionCameraUuid: req.detectionCameraUuid,
      talkdownProfile: genaipb.TalkdownProfile[req.talkdownProfile] ?? req.talkdownProfile,
      cameraSnapshotBytes: req.cameraSnapshot.length,
      hasDeprecatedEventUuid: req.deprecatedEventUuid !== undefined,
    });
  }
}
