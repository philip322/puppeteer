// index.js
import puppeteer from 'puppeteer';
import { readFileSync } from 'fs';

const userstr = readFileSync('hostinfo.txt', 'utf8').trim();
const [username,hostname] = userstr.split('@');
var panel=`panel${hostname.slice(1)}`
if(hostname.includes('ct8')){
    panel='panel.ct8.pl'
}
const password = readFileSync('password.txt', 'utf8').trim();
const ip=readFileSync('ip.txt', 'utf8').trim();
const account = {
    username,
    hostname,
    password,
    ip
}

async function delayTime(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
  
// 模拟登录函数
async function account_login(account)  {

  console.log('正在启动 Chromium...');

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/usr/bin/chromium-browser',
    defaultViewport: {
            width: 1280,
            height: 1180
    },
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--single-process',
      '--no-zygote',
      '--disable-software-rasterizer',  
      '--disable-gpu',
      '--disable-features=VizDisplayCompositor',
    ],
    dumpio: false
  });
const generateRandomUA = () => {
    const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.1 Safari/605.1.15',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.1 Safari/605.1.15'
    ];
    const randomUAIndex = Math.floor(Math.random() * userAgents.length);
    return userAgents[randomUAIndex];
};
  try {
    console.log('浏览器启动成功，准备打开页面...');
    const page = await browser.newPage();
    const customUA = generateRandomUA();
    await page.setUserAgent(customUA);
    
    await page.goto(`https://${panel}/login/?next=/`, { 
      waitUntil: 'domcontentloaded', 
      timeout: 60000 
    });
    
    console.log('\t页面加载成功，标题：', await page.title());
    await page.waitForSelector('input[name="username"]', { visible: true });
    await page.waitForSelector('input[name="password"]', { visible: true });
    console.log('找到用户名|密码输入框')
    // 输入用户名和密码
    await page.type('input[name="username"]', username, { delay: 100 });
    await page.type('input[name="password"]', password, { delay: 200 });
    console.log(`\t输入用户名: ${username}`)
    console.log(`\t密码: ******`)

    // 点击登录按钮
    const submitBtn=await page.$('.login-form__button button[type=submit]')
    console.log('找到登录按钮')
    
    await submitBtn.click()
    console.log('\t点击登录按钮。。。')
    
        // page.click('button[type="submit"]', { delay: 500 }) // 点击登录按钮
    await  page.waitForNavigation({ waitUntil: 'networkidle2' }); // 等待导航完成
    // 等待登录完成
    await page.waitForSelector(`a[href="/logout/"]`, { visible: true });
    console.log('完成登录！')
    
    let mes = `账号: ${username}@${hostname} Zeabur登录成功！\n From: ${ip}`;
    account.success = true;
    account.message = mes;
    console.log(mes);
    await delayTime(6000);
    const dt=new Date().toISOString();
    await page.screenshot({ path: `/data/${username}-${dt}.png` });
    console.log(`截图已保存：${username}-${dt}.png`);
    
  } catch (err) {
    console.error('出错了：', err.message);
    let mes = `账号: ${username}@${hostname} Zeabur登录失败.\n From: ${ip}`;
    account.success = false;
    account.message = mes;
  } finally {
    await browser.close();
    console.log('浏览器已关闭');
  }
};
async function sendTelegramMessage(message) {
    // 读取 telegram 信息
    const telegramJson = readFileSync('telegram.json', 'utf-8');
    const telegramConfig = JSON.parse(telegramJson);
    const { telegramBotToken, telegramBotUserId } = telegramConfig;
    const url = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;
    try {
        await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                chat_id: telegramBotUserId,
                text: message
            })
        });
      console.log(`Telegram 信息已发送：\n${message}`)
    } catch (error) {
        console.error('Error sending Telegram message:', error);
    }
}

// 格式化时间
function formatTzone(zone) {
    let nowtime = new Date().getTime();
    let ztime = new Date(nowtime + (zone * 60 * 60 * 1000));
    let outstr;
    if (zone == 8) {
        let dt = ztime.toISOString();
        outstr = dt.replace(/T|Z|\..*/g, ' ');
    } else {
        let dt = ztime.toGMTString().split(/ |:/);
        let Y = dt[3];
        let M = dt[2];
        let D = dt[1];
        let h = dt[4];
        let m = dt[5];
        let s = dt[6];
        let am = h > 12 ? "p.m." : 'a.m.';
        // 定制格式
        outstr = `${M}.${D},${Y}, ${h > 12 ? h - 12 : h}:${m} ${am}`;
    }
    return outstr;
}

// 批量同时异步登录
async function main(account) {
    // 同步：每个用户依次登录
    // for (const account of allaccounts) {
    //   await account_login(account);
    // }
    //异步同时登录
    //const results = await Promise.all(allaccounts.map(account => account_login(account)));
    // console.log('results:', results);
    // TG通知
     await Promise.all([
            await account_login(account), // 等待登录完成
            await sendTelegramMessage(account.message) // 提交TG通知
    ]);
}

main(account);
