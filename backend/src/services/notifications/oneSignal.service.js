const env = require('../../config/env');
const { logger } = require('../../utils/logger');

function isConfigured() {
  return Boolean(env.oneSignal.appId && env.oneSignal.apiKey);
}

async function sendPushToExternalUser(externalUserId, { heading, content, data = {} }) {
  if (!externalUserId || !isConfigured()) {
    if (!isConfigured()) {
      logger.warn('OneSignal notification skipped because configuration is missing');
    }
    return null;
  }

  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), 5000);

  const response = await fetch(env.oneSignal.apiUrl, {
    method: 'POST',
    signal: abortController.signal,
    headers: {
      Accept: 'application/json',
      Authorization: `Key ${env.oneSignal.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      app_id: env.oneSignal.appId,
      target_channel: 'push',
      include_aliases: {
        external_id: [String(externalUserId)]
      },
      headings: {
        en: heading,
        tr: heading
      },
      contents: {
        en: content,
        tr: content
      },
      data
    })
  }).finally(() => clearTimeout(timeout));

  const responseBody = await response.text();
  let parsedBody = null;

  try {
    parsedBody = responseBody ? JSON.parse(responseBody) : null;
  } catch {
    parsedBody = responseBody;
  }

  if (!response.ok) {
    const error = new Error('OneSignal notification request failed');
    error.statusCode = response.status;
    error.responseBody = parsedBody;
    throw error;
  }

  return parsedBody;
}

async function sendTaskAssignedNotification({ taskId, assignedUserId, title, assignedByName }) {
  const content = assignedByName
    ? `${assignedByName} size yeni bir görev atadı: ${title}`
    : `Size yeni bir görev atandı: ${title}`;

  try {
    const result = await sendPushToExternalUser(assignedUserId, {
      heading: 'Yeni görev atandı',
      content,
      data: {
        type: 'TASK_ASSIGNED',
        taskId: String(taskId)
      }
    });

    if (result) {
      logger.info('Task assignment push notification sent', {
        taskId,
        assignedUserId,
        oneSignalNotificationId: result.id
      });
    }
  } catch (error) {
    logger.warn('Task assignment push notification failed', {
      taskId,
      assignedUserId,
      error: logger.serializeError(error),
      responseBody: error.responseBody
    });
  }
}

module.exports = {
  sendTaskAssignedNotification
};
