import type { IOmnichannelServiceLevelAgreements } from '@rocket.chat/core-typings';
import { LivechatInquiry, LivechatRooms } from '@rocket.chat/models';

export const removeSLAFromRooms = async (slaId: string) => {
	const openRooms = await LivechatRooms.findOpenBySlaId(slaId, { projection: { _id: 1 } }).toArray();
	if (openRooms.length) {
		const openRoomIds: string[] = openRooms.map(({ _id }) => _id);
		await LivechatInquiry.bulkUnsetSla(openRoomIds);
	}

	await LivechatRooms.unsetSlaById(slaId);
};

export const updateInquiryQueueSla = async (roomId: string, sla: Pick<IOmnichannelServiceLevelAgreements, 'dueTimeInMinutes' | '_id'>) => {
	const inquiry = await LivechatInquiry.findOneByRoomId(roomId, { projection: { rid: 1, ts: 1 } });
	if (!inquiry) {
		return;
	}

	const { ts: chatStartedAt } = inquiry;
	const { dueTimeInMinutes, _id: slaId } = sla;

	const estimatedWaitingTimeQueue = dueTimeInMinutes;
	const estimatedServiceTimeAt = new Date(chatStartedAt.setMinutes(chatStartedAt.getMinutes() + dueTimeInMinutes));

	await LivechatInquiry.setSlaForRoom(inquiry.rid, {
		slaId,
		estimatedWaitingTimeQueue,
		estimatedServiceTimeAt,
	});
};

export const removeInquiryQueueSla = async (roomId: string) => {
	await LivechatInquiry.unsetSlaForRoom(roomId);
};