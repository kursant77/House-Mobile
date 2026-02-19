import { Bot, session, Context, SessionFlavor, Keyboard } from 'grammy';
import dotenv from 'dotenv';
import { supabase } from './lib/supabase';

dotenv.config(); // Load from local .env file

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
    console.error('FATAL: TELEGRAM_BOT_TOKEN is not defined in .env');
    process.exit(1);
}

// Define custom context type
interface MyContext extends Context, SessionFlavor<{}> { }

const bot = new Bot<MyContext>(token);

// Middleware
bot.use(session({ initial: () => ({}) }));

// ============================================
// COMMANDS
// ============================================

bot.command('start', async (ctx) => {
    const payload = ctx.match; // The parameter after /start (e.g., user ID)

    if (!payload) {
        // Check if user is already linked
        const { data: linkedUser } = await supabase
            .from('telegram_users')
            .select('user_id')
            .eq('telegram_chat_id', ctx.chat.id)
            .maybeSingle();

        if (linkedUser) {
            await ctx.reply(`👋 <b>House Mobile Botiga xush kelibsiz!</b>\n\nSizning hisobingiz allaqachon ulandiz. /help buyrug'i orqali imkoniyatlarni ko'rishingiz mumkin.`, {
                parse_mode: "HTML"
            });
            return;
        }

        const keyboard = new Keyboard()
            .requestContact("📱 Telefon raqamni ulashish")
            .resized()
            .oneTime();

        await ctx.reply(`👋 <b>House Mobile Botiga xush kelibsiz!</b>\n\nIlovadagi hisobingizni botga ulash uchun pastdagi "Telefon raqamni ulashish" tugmasini bosing.`, {
            parse_mode: "HTML",
            reply_markup: keyboard
        });
        return;
    }

    // Handle Account Linking
    const userId = payload;
    const chatId = ctx.chat.id;
    const username = ctx.from?.username;
    const firstName = ctx.from?.first_name;

    try {
        // Insert or Update telegram_users table
        const { error } = await supabase
            .from('telegram_users')
            .upsert({
                user_id: userId,
                telegram_chat_id: chatId,
                telegram_username: username,
                first_name: firstName,
                is_blocked: false,
                notification_settings: { orders: true, marketing: true, security: true },
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });

        if (error) {
            console.error('Error linking user:', error);
            await ctx.reply("❌ Xatolik yuz berdi. Iltimos qaytadan urinib ko'ring.");
            return;
        }

        await ctx.reply("✅ <b>Tabriklaymiz!</b>\nSizning Telegram hisobingiz House Mobile ilovasi bilan muvaffaqiyatli ulandi.\n\nEndi siz barcha muhim bildirishnomalarni shu yerda qabul qilasiz.", {
            parse_mode: "HTML"
        });

    } catch (err) {
        console.error(err);
        await ctx.reply("❌ Tizim xatoligi.");
    }
});

bot.command('help', async (ctx) => {
    await ctx.reply(`📖 <b>Yordam</b>\n\n/start - Botni boshlash\n/settings - Bildirishnoma sozlamalari\n/orders - Oxirgi buyurtmalarim\n/help - Yordam\n\nSavollar uchun: @house_mobile_support`, {
        parse_mode: "HTML"
    });
});

bot.command('settings', async (ctx) => {
    const chatId = ctx.chat.id;

    // Get current settings
    const { data, error } = await supabase
        .from('telegram_users')
        .select('notification_settings')
        .eq('telegram_chat_id', chatId)
        .single();

    if (error || !data) {
        await ctx.reply("❌ Avval hisobingizni ulashingiz kerak. Ilovadan 'Telegramni ulash' tugmasini bosing.");
        return;
    }

    const settings = data.notification_settings || { orders: true, marketing: true, security: true };

    await ctx.reply(
        `⚙️ <b>Bildirishnoma Sozlamalari</b>\n\n` +
        `📦 Buyurtmalar: ${settings.orders ? '✅ Yoqilgan' : '❌ O\'chirilgan'}\n` +
        `📣 Marketing: ${settings.marketing ? '✅ Yoqilgan' : '❌ O\'chirilgan'}\n` +
        `🔐 Xavfsizlik: ${settings.security ? '✅ Yoqilgan' : '❌ O\'chirilgan'}\n\n` +
        `Sozlamalarni o'zgartirish uchun ilovaga kiring.`,
        { parse_mode: "HTML" }
    );
});

bot.command('orders', async (ctx) => {
    const chatId = ctx.chat.id;

    // Get user from telegram_users
    const { data: telegramUser, error: telegramError } = await supabase
        .from('telegram_users')
        .select('user_id')
        .eq('telegram_chat_id', chatId)
        .single();

    if (telegramError || !telegramUser) {
        await ctx.reply("❌ Avval hisobingizni ulashingiz kerak.");
        return;
    }

    // Get recent orders
    const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, status, total_amount, created_at')
        .eq('user_id', telegramUser.user_id)
        .order('created_at', { ascending: false })
        .limit(5);

    if (ordersError || !orders || orders.length === 0) {
        await ctx.reply("📦 Sizda hali buyurtmalar yo'q.");
        return;
    }

    const statusEmoji: Record<string, string> = {
        pending: '⏳',
        confirmed: '✅',
        processing: '🔄',
        shipped: '🚚',
        delivered: '📬',
        cancelled: '❌'
    };

    const statusText: Record<string, string> = {
        pending: 'Kutilmoqda',
        confirmed: 'Tasdiqlangan',
        processing: 'Tayyorlanmoqda',
        shipped: 'Yetkazilmoqda',
        delivered: 'Yetkazildi',
        cancelled: 'Bekor qilindi'
    };

    let message = '📦 <b>Oxirgi buyurtmalaringiz:</b>\n\n';

    orders.forEach((order, index) => {
        const emoji = statusEmoji[order.status] || '📦';
        const status = statusText[order.status] || order.status;
        const amount = new Intl.NumberFormat('uz-UZ').format(order.total_amount);
        const date = new Date(order.created_at).toLocaleDateString('uz-UZ');

        message += `${index + 1}. ${emoji} <b>${status}</b>\n`;
        message += `   💰 ${amount} so'm\n`;
        message += `   📅 ${date}\n\n`;
    });

    await ctx.reply(message, { parse_mode: "HTML" });
});

// ============================================
// CONTACT HANDLING (Linking by Phone)
// ============================================

bot.on("message:contact", async (ctx) => {
    const contact = ctx.message.contact;
    if (!contact || contact.user_id !== ctx.from.id) {
        await ctx.reply("❌ Iltimos, faqat o'zingizning kontakt ma'lumotingizni yuboring.");
        return;
    }

    let phone = contact.phone_number;
    // Normalize phone number (remove +, spaces, etc.)
    phone = phone.replace(/\D/g, '');
    if (!phone.startsWith('+')) phone = '+' + phone;

    try {
        // 1. Find user by phone in profiles
        // We'll try both with and without + for safety, or just normalized
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, full_name')
            .or(`phone.eq.${phone},phone.eq.${phone.substring(1)}`)
            .maybeSingle();

        if (profileError) {
            console.error('Error finding profile:', profileError);
            await ctx.reply("❌ Xatolik yuz berdi. Iltimos keyinroq urinib ko'ring.");
            return;
        }

        if (!profile) {
            await ctx.reply("⚠️ Kechirasiz, bu telefon raqami bilan ro'yxatdan o'tgan foydalanuvchi topilmadi.\n\nIltimos, avval websaytdan ro'yxatdan o'ting.");
            return;
        }

        // 2. Link telegram_users
        const { error: linkError } = await supabase
            .from('telegram_users')
            .upsert({
                user_id: profile.id,
                telegram_chat_id: ctx.chat.id,
                telegram_username: ctx.from.username,
                first_name: ctx.from.first_name,
                is_blocked: false,
                notification_settings: { orders: true, marketing: true, security: true },
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });

        if (linkError) {
            console.error('Error linking user:', linkError);
            await ctx.reply("❌ Hisobni ulashda xatolik yuz berdi.");
            return;
        }

        await ctx.reply(`✅ <b>Tabriklaymiz, ${profile.full_name}!</b>\nSizning hisobingiz muvaffaqiyatli ulandi.\n\nEndi barcha bildirishnomalarni shu yerda qabul qilasiz.`, {
            parse_mode: "HTML",
            reply_markup: { remove_keyboard: true }
        });

    } catch (err) {
        console.error('System error in contact handler:', err);
        await ctx.reply("❌ Tizim xatoligi yuz berdi.");
    }
});

// ============================================
// MESSAGE HANDLING (Support Bridge)
// ============================================

bot.on('message', async (ctx) => {
    // Check if it's a text message
    if (!ctx.message.text) return;

    const chatId = ctx.chat.id;
    const text = ctx.message.text;

    // Get user from telegram_users
    const { data: telegramUser } = await supabase
        .from('telegram_users')
        .select('user_id')
        .eq('telegram_chat_id', chatId)
        .single();

    if (!telegramUser) {
        await ctx.reply("❌ Avval hisobingizni ulashingiz kerak. /start buyrug'ini yuboring.");
        return;
    }

    // Create an admin message for the support dashboard
    try {
        const { error } = await supabase
            .from('admin_messages')
            .insert({
                from_user_id: telegramUser.user_id,
                message: text,
                status: 'unread',
                source: 'telegram',
                telegram_message_id: ctx.message.message_id
            });

        if (error) throw error;

        await ctx.reply("📨 Xabaringiz yordam markaziga yuborildi. Tez orada javob beramiz!");
    } catch (err) {
        console.error('Error bridging message to admin:', err);
        await ctx.reply("❌ Xabar yuborishda xatolik yuz berdi. Iltimos keyinroq urinib ko'ring.");
    }
});

/**
 * Listener for Admin Replies (Realtime)
 * When an admin sends a message to a user who has Telegram linked,
 * the bot will deliver it to them automatically.
 */
supabase
    .channel('admin-responses')
    .on(
        'postgres_changes',
        {
            event: 'INSERT',
            schema: 'public',
            table: 'admin_messages'
        },
        async (payload) => {
            const newMessage = payload.new;

            // Only handle messages FROM admin TO a user
            if (!newMessage.to_user_id) return;

            // Get the recipient's Telegram chat ID
            const { data: telegramUser } = await supabase
                .from('telegram_users')
                .select('telegram_chat_id')
                .eq('user_id', newMessage.to_user_id)
                .single();

            if (!telegramUser) return;

            // Send the message via bot
            try {
                const message = `👨‍💼 <b>Yordam markazi javobi:</b>\n\n${newMessage.message}`;

                await bot.api.sendMessage(telegramUser.telegram_chat_id, message, {
                    parse_mode: "HTML"
                });

                // Update status to 'delivered' or similar if needed
                await supabase
                    .from('admin_messages')
                    .update({ status: 'pending' }) // or a new 'delivered' status
                    .eq('id', newMessage.id);

            } catch (err) {
                console.error('Error delivering admin reply:', err);
            }
        }
    )
    .subscribe();

// ============================================
// NOTIFICATION FUNCTIONS (Exported for external use)
// ============================================

/**
 * Send order status update to user via Telegram
 */
export async function sendOrderNotification(
    userId: string,
    orderId: string,
    status: string,
    orderDetails?: { total: number; productCount: number }
) {
    // Get user's Telegram chat ID
    const { data: telegramUser } = await supabase
        .from('telegram_users')
        .select('telegram_chat_id, notification_settings')
        .eq('user_id', userId)
        .single();

    if (!telegramUser || telegramUser.notification_settings?.orders === false) {
        return; // User not connected or notifications disabled
    }

    const statusEmoji: Record<string, string> = {
        pending: '⏳',
        confirmed: '✅',
        processing: '🔄',
        shipped: '🚚',
        delivered: '📬',
        cancelled: '❌'
    };

    const statusText: Record<string, string> = {
        pending: 'Buyurtma qabul qilindi',
        confirmed: 'Buyurtma tasdiqlandi',
        processing: 'Buyurtma tayyorlanmoqda',
        shipped: 'Buyurtma yetkazilmoqda',
        delivered: 'Buyurtma yetkazildi',
        cancelled: 'Buyurtma bekor qilindi'
    };

    const emoji = statusEmoji[status] || '📦';
    const text = statusText[status] || `Buyurtma holati: ${status}`;

    let message = `${emoji} <b>${text}</b>\n\n`;
    message += `🆔 Buyurtma: #${orderId.slice(0, 8).toUpperCase()}\n`;

    if (orderDetails) {
        const amount = new Intl.NumberFormat('uz-UZ').format(orderDetails.total);
        message += `📦 Mahsulotlar: ${orderDetails.productCount} ta\n`;
        message += `💰 Summa: ${amount} so'm\n`;
    }

    message += `\n🔗 Batafsil: housemobile.uz/my-orders`;

    try {
        await bot.api.sendMessage(telegramUser.telegram_chat_id, message, {
            parse_mode: "HTML"
        });
    } catch (error) {
        console.error('Error sending Telegram notification:', error);
    }
}

/**
 * Send notification to seller about new order
 */
export async function notifySellerNewOrder(
    sellerId: string,
    orderId: string,
    productName: string,
    buyerName: string,
    amount: number
) {
    const { data: telegramUser } = await supabase
        .from('telegram_users')
        .select('telegram_chat_id, notification_settings')
        .eq('user_id', sellerId)
        .single();

    if (!telegramUser || telegramUser.notification_settings?.orders === false) {
        return;
    }

    const amountFormatted = new Intl.NumberFormat('uz-UZ').format(amount);

    const message =
        `🎉 <b>Yangi buyurtma!</b>\n\n` +
        `📦 Mahsulot: ${productName}\n` +
        `👤 Xaridor: ${buyerName}\n` +
        `💰 Summa: ${amountFormatted} so'm\n\n` +
        `🔗 Seller Dashboard: housemobile.uz/seller/orders`;

    try {
        await bot.api.sendMessage(telegramUser.telegram_chat_id, message, {
            parse_mode: "HTML"
        });
    } catch (error) {
        console.error('Error notifying seller:', error);
    }
}

/**
 * Broadcast marketing message to all users (Admin function)
 */
export async function broadcastMessage(
    message: string,
    filter?: { role?: string; hasOrders?: boolean }
) {
    let query = supabase
        .from('telegram_users')
        .select('telegram_chat_id, notification_settings, user_id')
        .eq('is_blocked', false);

    const { data: users, error } = await query;

    if (error || !users) {
        console.error('Error fetching broadcast users:', error);
        return { sent: 0, failed: 0 };
    }

    // Filter users who have marketing notifications enabled
    const eligibleUsers = users.filter(u =>
        u.notification_settings?.marketing !== false
    );

    let sent = 0;
    let failed = 0;

    const BATCH_SIZE = 25;        // 25 concurrent sends per batch (safe below 30/s limit)
    const BATCH_DELAY_MS = 1100;  // 1.1s between batches → ~22 msgs/sec
    const MAX_RETRIES = 2;

    // Helper: send with retry on 429, skip on permanent failure
    const sendWithRetry = async (chatId: number, text: string, retries = MAX_RETRIES): Promise<boolean> => {
        try {
            await bot.api.sendMessage(chatId, text, { parse_mode: "HTML" });
            return true;
        } catch (error: any) {
            if (error?.error_code === 429 && retries > 0) {
                // Respect retry_after from Telegram
                const retryAfterMs = ((error?.parameters?.retry_after ?? 5) + 1) * 1000;
                await new Promise(resolve => setTimeout(resolve, retryAfterMs));
                return sendWithRetry(chatId, text, retries - 1);
            }
            if (error?.error_code === 403 || error?.error_code === 400) {
                // User blocked the bot or account deactivated — permanent failure, no retry
                return false;
            }
            if (retries > 0) {
                await new Promise(resolve => setTimeout(resolve, 3000));
                return sendWithRetry(chatId, text, retries - 1);
            }
            return false;
        }
    };

    // Process in batches to respect Telegram rate limits
    for (let i = 0; i < eligibleUsers.length; i += BATCH_SIZE) {
        const batch = eligibleUsers.slice(i, i + BATCH_SIZE);

        const results = await Promise.allSettled(
            batch.map(user => sendWithRetry(user.telegram_chat_id, message))
        );

        results.forEach(result => {
            if (result.status === 'fulfilled' && result.value) {
                sent++;
            } else {
                failed++;
            }
        });

        // Wait between batches (skip delay after the last batch)
        if (i + BATCH_SIZE < eligibleUsers.length) {
            await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
        }
    }

    return { sent, failed };
}

// Error handling
bot.catch((err) => {
    console.error('Bot error:', err);
});

// Start bot
console.log('🤖 House Mobile Telegram Bot started...');
console.log('📡 Commands: /start, /help, /settings, /orders');
bot.start();
