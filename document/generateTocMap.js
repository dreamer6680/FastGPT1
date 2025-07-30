const fs = require('fs');
const path = require('path');

const docsRoot = path.resolve(__dirname, 'content/docs'); // 你的文档根目录
const targetFile = path.resolve(__dirname, 'components/docs/not-found.tsx'); // 目标文件

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.filter((e) => e.isDirectory());
}

// 判断是否为无效页面（链接或标题）
function isInvalidPage(str) {
  if (!str || typeof str !== 'string') return true;
  // 链接格式：[text](url) 或 http(s):// 或 含括号
  if (/\[.*?\]\(.*?\)/.test(str) || /^https?:\/\//.test(str) || /[()]/.test(str)) {
    return true;
  }
  // 标题格式，--- 包围
  if (/^\s*---[\s\S]*---\s*$/.test(str)) {
    return true;
  }
  return false;
}

function getPage(str) {
  if (str.startsWith('...')) {
    return str.slice(3);
  }
  return str;
}

function generateExactMap(rootDir) {
  const exactMap = {};

  function recursive(dir) {
    const metaPath = path.join(dir, 'meta.json');
    if (fs.existsSync(metaPath)) {
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
      if (meta.pages && meta.pages.length > 0) {
        let firstValidPage = null;
        for (const page of meta.pages) {
          if (!isInvalidPage(page)) {
            firstValidPage = getPage(page);
            break;
          }
        }

        if (firstValidPage) {
          const relativePath = '/' + path.relative(rootDir, dir).replace(/\\/g, '/');
          let targetPath = '/docs' + relativePath + '/' + firstValidPage;

          // ✅ 如果这个“页面”其实是个子目录，则深入子目录寻找第一个有效 .mdx 文件
          const candidateDir = path.join(dir, firstValidPage);
          if (fs.existsSync(candidateDir) && fs.statSync(candidateDir).isDirectory()) {
            const subMetaPath = path.join(candidateDir, 'meta.json');
            if (fs.existsSync(subMetaPath)) {
              const subMeta = JSON.parse(fs.readFileSync(subMetaPath, 'utf-8'));
              if (subMeta.pages && subMeta.pages.length > 0) {
                for (const subPage of subMeta.pages) {
                  if (!isInvalidPage(subPage)) {
                    const subFirstPage = getPage(subPage);
                    targetPath = '/docs' + relativePath + '/' + firstValidPage + '/' + subFirstPage;
                    break;
                  }
                }
              }
            } else {
              // fallback：没有meta.json也尝试直接查找第一个 .mdx 文件
              const files = fs.readdirSync(candidateDir);
              const firstMdx = files.find((f) => f.endsWith('.mdx'));
              if (firstMdx) {
                targetPath =
                  '/docs' +
                  relativePath +
                  '/' +
                  firstValidPage +
                  '/' +
                  firstMdx.replace(/\.mdx$/, '');
              }
            }
          }

          const mapKey = '/docs' + relativePath;
          exactMap[mapKey] = targetPath;
        }
      }
    }

    const subdirs = walkDir(dir);
    subdirs.forEach((subdir) => recursive(path.join(dir, subdir.name)));
  }

  recursive(rootDir);
  return exactMap;
}

function updateExactMap2InFile(filePath, exactMapObj) {
  if (!fs.existsSync(filePath)) {
    console.error(`文件不存在: ${filePath}`);
    process.exit(1);
  }

  let content = fs.readFileSync(filePath, 'utf-8');
  const exactMapStr = JSON.stringify(exactMapObj, null, 2);

  // 生成新的 exactMap2 定义（保持 const 和类型）
  const newExactMapExport = `const exactMap2: Record<string, string> = ${exactMapStr};`;

  // 匹配 exactMap2 定义
  const regex = /(const|let|var)\s+exactMap2\s*:\s*Record<string,\s*string>\s*=\s*\{[\s\S]*?\};?/m;

  if (regex.test(content)) {
    content = content.replace(regex, newExactMapExport);
  } else {
    if (!content.endsWith('\n')) content += '\n';
    content += newExactMapExport + '\n';
  }

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`Updated exactMap2 in ${filePath}`);
}

// 主流程
const exactMap = generateExactMap(docsRoot);
updateExactMap2InFile(targetFile, exactMap);
