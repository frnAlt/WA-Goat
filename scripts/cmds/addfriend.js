module.exports = {
    config: {
        name: "addfriend",
        aliases: [],
        version: "2.4.71",
        author: "frnAlt",
        countDown: 10,
        role: 2,
        shortDescription: {
            en: "Send friend request to a user"
        },
        description: {
            en: "Send contact card / friend connect to a WhatsApp user by phone number or wa.me URL"
        },
        category: "owner",
        guide: {
            en: "{pn} <phoneNumber> - Add user by phone number\n{pn} <wa.me URL> - Add user by WhatsApp link"
        }
    },

    ST: async function ({ api, message, args, getLang }) {
        try {
            if (!args[0]) {
                return message.reply("❌ Please provide a phone number or WhatsApp link.\n\nUsage:\n• !addfriend 8801712345678\n• !addfriend https://wa.me/8801712345678");
            }

            let userID = args[0].replace(/^@/, "").trim();

            // Extract phone number from wa.me or WhatsApp link
            if (userID.includes("wa.me") || userID.includes("whatsapp.com")) {
                const urlMatch = userID.match(/(?:wa\.me\/|phone=|\/)(\d+)/);
                if (urlMatch && urlMatch[1]) {
                    userID = urlMatch[1];
                }
            } else if (userID.includes("@s.whatsapp.net")) {
                userID = userID.split("@")[0];
            }

            // Strip non-numeric characters for phone number
            userID = userID.replace(/[^0-9]/g, "");

            if (!userID || userID.length < 6) {
                return message.reply("❌ Invalid phone number or user ID format.");
            }



            const result = await api.sendFriendRequest(userID);

            if (result && result.success) {
                let responseMessage = "✅ FRIEND REQUEST SENT SUCCESSFULLY!\n";
                responseMessage += "═══════════════════════════════\n\n";
                responseMessage += `👤 User ID: ${result.userID}\n`;
                responseMessage += `📝 Status: ${result.friendshipStatus}\n`;

                if (result.actionTitle) {
                    responseMessage += `⚡ Action: ${result.actionTitle}\n`;
                }

                responseMessage += "\n═══════════════════════════════";
                responseMessage += "\n💡 The friend request has been sent successfully!";

                message.reply(responseMessage);
            } else {
                message.reply(`❌ Failed to send friend request to user ID: ${userID}`);
            }

        } catch (error) {
            console.error("Error in sendfriendrequest command:", error);

            let errorMessage = "❌ An error occurred while sending friend request.\n\n";

            if (error.message && error.message.includes("GraphQL")) {
                errorMessage += "🔍 Error: GraphQL request failed\n";
                errorMessage += "💡 This might happen if:\n";
                errorMessage += "• The user ID doesn't exist\n";
                errorMessage += "• The user has blocked friend requests\n";
                errorMessage += "• You've already sent a request to this user\n";
                errorMessage += "• Rate limiting is in effect\n";
            } else if (error.error) {
                errorMessage += `🔍 Error: ${error.error}\n`;
            } else {
                errorMessage += "🔍 Error: Unknown error occurred\n";
            }

            errorMessage += "\nPlease try again later or check the user ID.";

            message.reply(errorMessage);
        }
    }
};

module.exports.onStart = module.exports.ST;
