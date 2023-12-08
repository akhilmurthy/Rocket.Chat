import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';
import { useStream } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import type { MessageList } from '../../lib/lists/MessageList';
import type { FieldExpression, Query } from '../../lib/minimongo';
import { createFilterFromQuery } from '../../lib/minimongo';

type NotifyRoomRidDeleteMessageBulkEvent = {
	rid: IMessage['rid'];
	excludePinned: boolean;
	ignoreDiscussion: boolean;
	ts: FieldExpression<Date>;
	users: string[];
	reportedMessages?: { messageIds: string[]; hidden: boolean; showDeletedStatus: boolean; remove: boolean };
};

const createDeleteCriteria = (params: NotifyRoomRidDeleteMessageBulkEvent): ((message: IMessage) => boolean) => {
	const query: Query<IMessage> = {};
	const { reportedMessages } = params;
	if (
		reportedMessages &&
		reportedMessages.messageIds.length > 0 &&
		(reportedMessages?.remove || reportedMessages?.showDeletedStatus || reportedMessages?.hidden)
	) {
		return createFilterFromQuery<IMessage>({ _id: { $in: reportedMessages.messageIds } });
	}

	query.ts = params.ts;

	if (params.excludePinned) {
		query.pinned = { $ne: true };
	}

	if (params.ignoreDiscussion) {
		query.drid = { $exists: false };
	}
	if (params.users?.length) {
		query['u.username'] = { $in: params.users };
	}

	return createFilterFromQuery<IMessage>(query);
};

export const useStreamUpdatesForMessageList = (messageList: MessageList, uid: IUser['_id'] | null, rid: IRoom['_id'] | null): void => {
	const subscribeToRoomMessages = useStream('room-messages');
	const subscribeToNotifyRoom = useStream('notify-room');

	useEffect(() => {
		if (!uid || !rid) {
			messageList.clear();
			return;
		}

		const unsubscribeFromRoomMessages = subscribeToRoomMessages(rid, (message) => {
			messageList.handle(message);
		});

		const unsubscribeFromDeleteMessage = subscribeToNotifyRoom(`${rid}/deleteMessage`, ({ _id: mid }) => {
			messageList.remove(mid);
		});

		const unsubscribeFromDeleteMessageBulk = subscribeToNotifyRoom(`${rid}/deleteMessageBulk`, (params) => {
			const matchDeleteCriteria = createDeleteCriteria(params);
			messageList.prune(matchDeleteCriteria);
		});

		return (): void => {
			unsubscribeFromRoomMessages();
			unsubscribeFromDeleteMessage();
			unsubscribeFromDeleteMessageBulk();
		};
	}, [subscribeToRoomMessages, subscribeToNotifyRoom, uid, rid, messageList]);
};
