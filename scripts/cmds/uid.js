const { findUid } = global.utils;
const regExCheckURL = /^(http|https):\/\/[^ "]+$/;

module.exports = {
	config: {
		name: "uid",
		version: "1.3",
		author: "frnAlt",
		countDown: 5,
		role: 0,
		description: {
			vi: "Xem user id WhatsApp của người dùng",
			en: "View WhatsApp user JID / phone ID of user"
		},
		category: "info",
		guide: {
			vi: "   {pn}: dùng để xem id WhatsApp của bạn"
				+ "\n   {pn} @tag: xem id WhatsApp của những người được tag"
				+ "\n   {pn} <phone/link>: xem id WhatsApp của số điện thoại/link"
				+ "\n   Phản hồi tin nhắn của người khác kèm lệnh để xem id WhatsApp của họ",
			en: "   {pn}: use to view your WhatsApp ID"
				+ "\n   {pn} @tag: view WhatsApp ID of tagged people"
				+ "\n   {pn} <phone/link>: view WhatsApp ID of phone/link"
				+ "\n   Reply to someone's message with the command to view their WhatsApp ID"
		}
	},

	langs: {
		vi: {
			syntaxError: "Vui lòng tag người muốn xem uid hoặc để trống để xem uid của bản thân"
		},
		en: {
			syntaxError: "Please tag the person you want to view uid or leave it blank to view your own uid"
		}
	},

	onStart: async function ({ message, event, args, getLang }) {
		if (event.messageReply)
			return message.reply(event.messageReply.senderID);
		if (!args[0])
			return message.reply(event.senderID);
		if (args[0].match(regExCheckURL)) {
			let msg = '';
			for (const link of args) {
				try {
					const uid = await findUid(link);
					msg += `${link} => ${uid}\n`;
				}
				catch (e) {
					msg += `${link} (ERROR) => ${e.message}\n`;
				}
			}
			message.reply(msg);
			return;
		}

		let msg = "";
		const { mentions } = event;
		for (const id in mentions)
			msg += `${mentions[id].replace("@", "")}: ${id}\n`;

		if (!msg && args.length > 0) {
			const raw = args.join(" ").replace(/^@/, "").trim().toLowerCase();
			const allM = global.db?.allThreadData?.find(t => t.threadID == event.threadID)?.members || [];
			const found = allM.find(m => m.name && m.name.toLowerCase().includes(raw)) ||
			              global.db?.allUserData?.find(u => u.name && u.name.toLowerCase().includes(raw));
			if (found) {
				msg = `${found.name}: ${found.userID || found.id}\n`;
			}
		}

		message.reply(msg || getLang("syntaxError"));
	}
};