module.exports = {
	config: {
		name: "adduser",
		version: "2.0.0",
		author: "frnAlt",
		countDown: 5,
		role: 1,
		description: {
			vi: "Thêm thành viên vào nhóm WhatsApp",
			en: "Add member to WhatsApp group chat"
		},
		category: "box chat",
		guide: {
			en: "{pn} <phone number | wa.me link | @mention>\nExamples:\n• {pn} +1234567890\n• {pn} https://wa.me/1234567890\n• {pn} @user"
		}
	},

	langs: {
		vi: {
			alreadyInGroup: "Đã có trong nhóm",
			successAdd: "✅ Đã thêm thành công %1 thành viên vào nhóm",
			failedAdd: "❌ Không thể thêm %1 thành viên vào nhóm",
			invalidPhone: "Vui lòng nhập số điện thoại hoặc link WhatsApp hợp lệ",
			cannotAddUser: "Không thể thêm người này vào nhóm (kiểm tra quyền quản trị viên của bot hoặc cài đặt quyền riêng tư của người dùng)"
		},
		en: {
			alreadyInGroup: "Already in group",
			successAdd: "✅ Successfully added %1 member(s) to the group",
			failedAdd: "❌ Failed to add %1 member(s) to the group",
			invalidPhone: "Please provide a valid phone number or WhatsApp link",
			cannotAddUser: "Cannot add user (verify bot is group admin or check user's privacy settings)"
		}
	},

	onStart: async function ({ message, api, event, args, threadsData, getLang }) {
		if (!event.threadID || !event.threadID.endsWith("@g.us")) {
			return message.reply("ℹ️ This command can only be used in WhatsApp groups.");
		}

		const targets = [];

		// 1. Mentions
		if (event.mentions && Object.keys(event.mentions).length > 0) {
			for (const uid of Object.keys(event.mentions)) {
				const clean = String(uid).replace(/[^0-9]/g, "");
				if (clean) targets.push(clean);
			}
		}

		// 2. Reply to user
		if (event.messageReply && event.messageReply.senderID) {
			const clean = String(event.messageReply.senderID).replace(/[^0-9]/g, "");
			if (clean) targets.push(clean);
		}

		// 3. Arguments (phone numbers, wa.me links, JIDs)
		for (const raw of args) {
			let clean = raw.trim();
			if (clean.includes("wa.me/") || clean.includes("whatsapp.com/")) {
				const match = clean.match(/(?:wa\.me\/|phone=|\/)(\d+)/);
				if (match && match[1]) clean = match[1];
			}
			clean = clean.replace(/[^0-9]/g, "");
			if (clean.length >= 7 && !targets.includes(clean)) {
				targets.push(clean);
			}
		}

		if (targets.length === 0) {
			return message.reply(getLang("invalidPhone"));
		}

		const threadInfo = await threadsData.get(event.threadID).catch(() => ({}));
		const members = threadInfo.members || [];
		const success = [];
		const failed = [];

		for (const phone of targets) {
			const jid = `${phone}@s.whatsapp.net`;
			if (members.some(m => m.userID === jid || m.userID === phone)) {
				failed.push({ phone, reason: getLang("alreadyInGroup") });
				continue;
			}

			try {
				if (typeof api.addUserToGroup === "function") {
					await api.addUserToGroup(jid, event.threadID);
					success.push(phone);
				} else {
					failed.push({ phone, reason: "addUserToGroup not available on socket" });
				}
			} catch (err) {
				failed.push({ phone, reason: err.message || getLang("cannotAddUser") });
			}
		}

		let msg = "";
		if (success.length > 0) {
			msg += `${getLang("successAdd", success.length)}\n` + success.map(s => `  + ${s}`).join("\n");
		}
		if (failed.length > 0) {
			if (msg) msg += "\n\n";
			msg += `${getLang("failedAdd", failed.length)}\n` + failed.map(f => `  - ${f.phone}: ${f.reason}`).join("\n");
		}

		return message.reply(msg);
	}
};