import { normalizePath } from 'obsidian';
import { join } from 'obsidian-dev-utils/Path';
import { escapeRegExp } from 'obsidian-dev-utils/RegExp';

import type { CustomAttachmentLocationPlugin } from './CustomAttachmentLocationPlugin.ts';

import {
  Substitutions,
  validatePath
} from './Substitutions.ts';

export async function getAttachmentFolderFullPathForPath(
  plugin: CustomAttachmentLocationPlugin,
  notePath: string,
  attachmentFilename: string
): Promise<string> {
  return await getAttachmentFolderPath(plugin, new Substitutions(plugin.app, notePath, attachmentFilename));
}

export async function getPastedFileName(plugin: CustomAttachmentLocationPlugin, substitutions: Substitutions): Promise<string> {
  return await resolvePathTemplate(plugin, plugin.settings.generatedAttachmentFilename, substitutions);
}

export function replaceWhitespace(plugin: CustomAttachmentLocationPlugin, str: string): string {
  if (plugin.settings.whitespaceReplacement) {
    str = str.replace(/\s/g, plugin.settings.whitespaceReplacement);
    const escaped = escapeRegExp(plugin.settings.whitespaceReplacement);
    str = str.replace(new RegExp(`${escaped}{2,}`, 'g'), plugin.settings.whitespaceReplacement);
  }

  return str;
}

async function getAttachmentFolderPath(plugin: CustomAttachmentLocationPlugin, substitutions: Substitutions): Promise<string> {
  return await resolvePathTemplate(plugin, plugin.settings.attachmentFolderPath, substitutions);
}

async function resolvePathTemplate(plugin: CustomAttachmentLocationPlugin, template: string, substitutions: Substitutions): Promise<string> {
  let resolvedPath = await substitutions.fillTemplate(template);
  const validationError = validatePath(resolvedPath, false);
  if (validationError) {
    throw new Error(`Resolved path ${resolvedPath} is invalid: ${validationError}`);
  }

  if (plugin.settings.shouldRenameAttachmentsToLowerCase) {
    resolvedPath = resolvedPath.toLowerCase();
  }

  if (!resolvedPath.endsWith('/')) {
    resolvedPath += '/';
  }

  resolvedPath = replaceWhitespace(plugin, resolvedPath);
  if (resolvedPath.startsWith('./') || resolvedPath.startsWith('../')) {
    resolvedPath = join(substitutions.folderPath, resolvedPath);
  }

  resolvedPath = normalizePath(resolvedPath);
  return resolvedPath;
}
