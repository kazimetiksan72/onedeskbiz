const env = require('../../config/env');
const { logger } = require('../../utils/logger');
const notificationsService = require('../modules/notifications.service');

function isConfigured() {
  return Boolean(env.oneSignal.appId && env.oneSignal.apiKey);
}

function getMissingConfigKeys() {
  return [
    env.oneSignal.appId ? null : 'ONESIGNAL_APP_ID',
    env.oneSignal.apiKey ? null : 'ONESIGNAL_REST_API_KEY'
  ].filter(Boolean);
}

async function sendPushToExternalUsers(externalUserIds, { heading, content, data = {} }) {
  const userIds = [...new Set(externalUserIds.filter(Boolean).map((id) => String(id)))];

  if (userIds.length === 0 || !isConfigured()) {
    if (!isConfigured()) {
      logger.warn('OneSignal notification skipped because configuration is missing', {
        missingConfigKeys: getMissingConfigKeys()
      });
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
        external_id: userIds
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

async function sendPushToExternalUser(externalUserId, message) {
  return sendPushToExternalUsers([externalUserId], message);
}

async function sendTaskAssignedNotification({ taskId, assignedUserId, title, assignedByName }) {
  const content = assignedByName
    ? `${assignedByName} size yeni bir görev atadı: ${title}`
    : `Size yeni bir görev atandı: ${title}`;
  const notification = {
    type: 'TASK_ASSIGNED',
    title: 'Yeni görev atandı',
    message: content,
    data: {
      type: 'TASK_ASSIGNED',
      taskId: String(taskId)
    }
  };

  await notificationsService.createForUsers([assignedUserId], notification);

  try {
    const result = await sendPushToExternalUser(assignedUserId, {
      heading: notification.title,
      content: notification.message,
      data: notification.data
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

const requestTypeLabels = {
  VEHICLE: 'Araç talebi',
  LEAVE: 'İzin talebi',
  MATERIAL: 'Malzeme talebi',
  EXPENSE: 'Masraf talebi',
  ASSET: 'Demirbaş talebi'
};

async function sendRequestCreatedNotification({ requestId, approverUserIds, requesterName, requestType }) {
  const label = requestTypeLabels[requestType] || 'Talep';
  const content = requesterName
    ? `${requesterName} yeni bir ${label.toLowerCase()} oluşturdu.`
    : `Yeni bir ${label.toLowerCase()} oluşturuldu.`;
  const notification = {
    type: 'REQUEST_CREATED',
    title: `Yeni ${label.toLowerCase()}`,
    message: content,
    data: {
      type: 'REQUEST_CREATED',
      requestId: String(requestId),
      requestType
    }
  };

  await notificationsService.createForUsers(approverUserIds, notification);

  try {
    const result = await sendPushToExternalUsers(approverUserIds, {
      heading: notification.title,
      content: notification.message,
      data: notification.data
    });

    if (result) {
      logger.info('Request approval push notification sent', {
        requestId,
        approverCount: approverUserIds.length,
        oneSignalNotificationId: result.id
      });
    }
  } catch (error) {
    logger.warn('Request approval push notification failed', {
      requestId,
      approverUserIds,
      error: logger.serializeError(error),
      responseBody: error.responseBody
    });
  }
}

async function sendRequestApprovedNotification({ requestId, requesterUserId, requestType, approverName }) {
  const label = requestTypeLabels[requestType] || 'Talebiniz';
  const content = approverName
    ? `${label} ${approverName} tarafından onaylandı.`
    : `${label} onaylandı.`;
  const notification = {
    type: 'REQUEST_APPROVED',
    title: 'Talebiniz onaylandı',
    message: content,
    data: {
      type: 'REQUEST_APPROVED',
      requestId: String(requestId),
      requestType
    }
  };

  await notificationsService.createForUsers([requesterUserId], notification);

  try {
    const result = await sendPushToExternalUser(requesterUserId, {
      heading: notification.title,
      content: notification.message,
      data: notification.data
    });

    if (result) {
      logger.info('Request approved push notification sent', {
        requestId,
        requesterUserId,
        oneSignalNotificationId: result.id
      });
    }
  } catch (error) {
    logger.warn('Request approved push notification failed', {
      requestId,
      requesterUserId,
      error: logger.serializeError(error),
      responseBody: error.responseBody
    });
  }
}

module.exports = {
  sendTaskAssignedNotification,
  sendRequestCreatedNotification,
  sendRequestApprovedNotification
};
