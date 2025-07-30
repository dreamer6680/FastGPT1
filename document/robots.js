import * as fs from 'node:fs/promises';
import fg from 'fast-glob';
import matter from 'gray-matter';
import { i18n } from './lib/i18n.ts';
import path from 'node:path';

const ROBOTS_PATH = './content/docs/robots.mdx'; // 改成你的 robots.mdx 路径

function filePathToUrl(filePath, defaultLanguage) {
  let urlPath = filePath.replace('./content/docs/', '');

  const basePath = defaultLanguage === 'zh-CN' ? '/docs' : '/en/docs';

  if (defaultLanguage !== 'zh-CN' && urlPath.endsWith('.en.mdx')) {
    urlPath = urlPath.replace('.en.mdx', '');
  } else if (urlPath.endsWith('.mdx')) {
    urlPath = urlPath.replace('.mdx', '');
  }

  if (urlPath.endsWith('/index')) {
    urlPath = urlPath.replace('/index', '');
  }

  return `${basePath}/${urlPath}`.replace(/\/\/+/g, '/');
}

async function generateRobotsMarkdown() {
  const defaultLanguage = i18n.defaultLanguage;
  const globPattern =
    defaultLanguage === 'zh-CN' ? ['./content/docs/**/*.mdx'] : ['./content/docs/**/*.en.mdx'];

  const files = await fg(globPattern);
  const urls = files.map((file) => filePathToUrl(file, defaultLanguage));
  urls.sort((a, b) => a.localeCompare(b));

  const markdownLinks = urls.map((url) => `- [${url}](${url})`).join('\n');

  // 读取 robots.mdx 内容
  const robotsRaw = await fs.readFile(ROBOTS_PATH, 'utf-8');
  const parsed = matter(robotsRaw);

  // 拼接：保留元数据，只替换正文内容
  const newContent = matter.stringify(markdownLinks, parsed.data);

  await fs.writeFile(ROBOTS_PATH, newContent, 'utf-8');
  console.log(`✅ 已成功写入 ${urls.length} 条链接至 ${ROBOTS_PATH}`);
}

generateRobotsMarkdown().catch(console.error);
