import { promises as fsp } from 'fs'
import * as path from 'path'

/** 打开文件大小上限：超过则拒绝，避免一次性读入内存导致 OOM。 */
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 MB

/** 白名单容量上限，超过则淘汰最早条目，防止长会话无限增长。 */
const MAX_WRITE_PATHS = 50

const allowedWritePaths: string[] = []

/** 校验路径是否在授权白名单内（仅对话框选择过的路径可被 file:save 写入）。 */
export function isPathAllowed(p: string): boolean {
  if (!p) return false
  return allowedWritePaths.includes(path.resolve(p))
}

/** 将路径登记进白名单；超出上限时淘汰最早条目。 */
export function allowPath(p: string): void {
  if (!p) return
  const normalized = path.resolve(p)
  if (!allowedWritePaths.includes(normalized)) {
    allowedWritePaths.push(normalized)
    if (allowedWritePaths.length > MAX_WRITE_PATHS) {
      allowedWritePaths.shift()
    }
  }
}

/** 清空白名单（窗口关闭时调用）。 */
export function clearAllowedPaths(): void {
  allowedWritePaths.length = 0
}

/**
 * 读取文件内容为 UTF-8 字符串，自动移除 BOM。
 * 超过 MAX_FILE_SIZE 抛错，由调用方转成用户可读提示。
 */
export async function readTextFile(filePath: string): Promise<string> {
  const stat = await fsp.stat(filePath)
  if (stat.size > MAX_FILE_SIZE) {
    const mb = (stat.size / 1024 / 1024).toFixed(1)
    throw new Error(`文件过大（${mb} MB），超过 ${MAX_FILE_SIZE / 1024 / 1024} MB 限制`)
  }
  const buffer = await fsp.readFile(filePath)
  let content = buffer.toString('utf-8')
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1)
  }
  return content
}

/** 以 UTF-8 写入文本文件。 */
export async function writeTextFile(filePath: string, content: string): Promise<void> {
  await fsp.writeFile(filePath, content, 'utf-8')
}

/** 写入二进制文件（用于 PDF 等导出产物）。 */
export async function writeBinaryFile(filePath: string, data: Uint8Array): Promise<void> {
  await fsp.writeFile(filePath, data)
}
