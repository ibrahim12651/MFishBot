const mineflayer = require('mineflayer');
const axios = require('axios');

const bot = mineflayer.createBot({
  host: '',
  port: 25565,
  username: '',
  auth: 'none',
  version: ''
});

const discordWebhookUrl = 'https://discord.com/api/webhooks/1283362490536689747/OW4oljjtLo1wCAlxtDYHp1hIYbb2QdUVLiTOff7z-F_2bug_K_LHNcFygq9RolGvhncK'; 

let fishingInProgress = false; // Olta atılıp balık bekleniyor mu?
let fishingTimeout = null; // Balık tutma için zamanlayıcı
let retryFishing = false; // Tekrar balık tutma işlemi

bot.on('spawn', () => {
  console.log('Bot dünyaya girdi!');
  bot.chat('/register  ');
  bot.chat('/login ');

  setTimeout(() => {
    bot.chat('/skyblock');
    setTimeout(startFishing, 5000); // 5 saniye bekleyip balık tutmaya başla
  }, 2000);
});

function startFishing() {
  if (fishingInProgress) {
    console.log('Balık tutma işlemi zaten devam ediyor.');
    return;
  }

  fishingInProgress = true;
  retryFishing = false; // Başka bir işlem sırasında tekrar denemeyi iptal et
  console.log('Olta atılıyor...');

  bot.fish().then(() => {
    console.log('Balık başarıyla yakalandı!');
    fishingInProgress = false;
    clearTimeout(fishingTimeout);
    sendInventoryToDiscord();
    setTimeout(startFishing, 5000); // 5 saniye sonra tekrar balık tutmaya başla
  }).catch((err) => {
    console.error('Balık tutma sırasında hata oluştu:', err);
    fishingInProgress = false;
    clearTimeout(fishingTimeout);
    if (!retryFishing) {
      retryFishing = true; // Eğer başarısız olursa bir kez daha dene
      setTimeout(startFishing, 5000);
    }
  });

  fishingTimeout = setTimeout(() => {
    if (fishingInProgress) {
      console.log('Balık yakalanamadı, tekrar deneme yapılıyor.');
      bot.activateItem(); // Oltayı tekrar çek
      fishingInProgress = false;
      if (!retryFishing) {
        retryFishing = true;
        setTimeout(startFishing, 5000); // 5 saniye sonra yeniden dene
      }
    }
  }, 33000); // 33 saniye zamanlayıcı
}

function sendInventoryToDiscord() {
  const inventoryItems = bot.inventory.items(); // Envanterdeki tüm öğeleri al

  if (inventoryItems.length === 0) {
    sendDiscordMessage('Envanter boş!');
    return;
  }

  let inventoryList = 'Envanterdeki öğeler:\n';
  inventoryItems.forEach(item => {
    inventoryList += `${item.count}x ${item.displayName}\n`;
  });

  sendDiscordMessage(inventoryList);
}

function sendDiscordMessage(content) {
  axios.post(discordWebhookUrl, {
    content: content
  }).catch(err => console.error('Discord’a mesaj gönderilirken hata:', err));
}

// Bot hatalarına ve bağlantı kesilmelerine karşı loglama
bot.on('error', (err) => console.log('Hata:', err));
bot.on('end', () => console.log('Bağlantı kesildi!'));
