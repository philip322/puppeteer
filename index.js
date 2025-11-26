// index.js
import puppeteer from 'puppeteer';
// formatDate.js  —— 直接挂载到 Date 原型上，全局可用
;(() => {
  // 只扩展一次，避免重复污染
  if (Date.prototype.format) return;

  /**
   * 强大的 Date.format() 方法
   * 用法：new Date().format('yyyy-MM-dd hh:mm:ss', 'Asia/Shanghai')
   *       new Date().format('yyyy年MM月dd日 hh:mm')
   *       new Date().format('yyyy-MM-dd hh:mm:ss', '+08:00')
   *       new Date().format('yyyy-MM-dd hh:mm:ss', 'UTC')
   */
  Date.prototype.format = function (fmt = 'yyyy-MM-dd hh:mm:ss', timezone) {
    let date = this;

    // ============ 时区处理 ============
    let offsetMinutes = this.getTimezoneOffset();
    if (timezone) {
      if (typeof timezone === 'number') {
        offsetMinutes = timezone * 60;
      } else if (typeof timezone === 'string') {
        if (timezone.toUpperCase() === 'UTC' || timezone === 'Z') {
          offsetMinutes = 0;
        } else if (timezone.includes('/')) {
          // IANA 时区（如 Asia/Shanghai）→ 使用 Intl 完美处理夏令时
          const parts = new Intl.DateTimeFormat('zh-CN', {
            timeZone: timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
          }).formatToParts(date);

          const map = {};
          parts.forEach(p => map[p.type] = p.value);
          return fmt
            .replace(/yyyy/g, map.year)
            .replace(/yy/g, map.year.slice(-2))
            .replace(/MM/g, map.month)
            .replace(/M/g, Number(map.month))
            .replace(/dd/g, map.day)
            .replace(/d/g, Number(map.day))
            .replace(/hh/g, map.hour)
            .replace(/h/g, Number(map.hour))
            .replace(/mm/g, map.minute)
            .replace(/m/g, Number(map.minute))
            .replace(/ss/g, map.second)
            .replace(/s/g, Number(map.second));
        } else {
          // +08:00 或 -05:30 格式
          const m = timezone.match(/^([+-])(\d{2}):?(\d{2})$/);
          if (m) {
            offsetMinutes = (m[1] === '-' ? -1 : 1) * (parseInt(m[2]) * 60 + parseInt(m[3]));
          }
        }
      }

      // 手动偏移（非 IANA 时区）
      const utc = date.getTime() + date.getTimezoneOffset() * 60000;
      date = new Date(utc + offsetMinutes * 60000);
    }

    // ============ 常规格式替换 ============
    const o = {
      'y+': date.getFullYear(),
      'M+': date.getMonth() + 1,
      'd+': date.getDate(),
      'h+': date.getHours(),
      'm+': date.getMinutes(),
      's+': date.getSeconds(),
    };

    // yyyy, yy
    if (/(y+)/.test(fmt)) {
      fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length));
    }

    for (const k in o) {
      if (new RegExp(`(${k})`).test(fmt)) {
        const str = o[k] + '';
        fmt = fmt.replace(RegExp.$1, RegExp.$1.length === 1 ? str : str.padStart(2, '0'));
      }
    }

    return fmt;
  };

  // 可选：添加别名，方便链式调用
  Date.prototype.fmt = Date.prototype.format;
})();

(async () => {
  console.log('正在启动 Chromium...');

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/usr/bin/chromium-browser',
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

  try {
    console.log('浏览器启动成功，准备打开页面...');
    const page = await browser.newPage();
    
    await page.goto('https://time.yingming006.cn/', { 
      waitUntil: 'domcontentloaded', 
      timeout: 30000 
    });
    
    console.log('页面加载成功，标题：', await page.title());
    const dt=new Date().fmt('yyyy-MM-ddThh:mm:ss');
    await page.screenshot({ path: `success-${dt}.png` });
    console.log(`截图已保存：success-${dt}.png`);
    
  } catch (err) {
    console.error('出错了：', err.message);
  } finally {
    await browser.close();
    console.log('浏览器已关闭');
  }
})();
