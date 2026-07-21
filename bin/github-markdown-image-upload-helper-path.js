#!/usr/bin/env node
import { fileURLToPath } from 'node:url';

console.log(fileURLToPath(new URL('../lib/github-markdown-image-upload-helper.mjs', import.meta.url)));
