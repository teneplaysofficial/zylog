# Zylog

> A simple and powerful logger for Node.js

[![CI](https://github.com/teneplaysofficial/zylog/actions/workflows/ci.yml/badge.svg)](https://github.com/teneplaysofficial/zylog/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/zylog.svg?logo=npm&color=brightgreen)](https://www.npmjs.com/package/zylog)
[![Downloads](https://img.shields.io/npm/dt/zylog?logo=npm)](https://www.npmjs.com/package/zylog)
[![codecov](https://codecov.io/gh/teneplaysofficial/zylog/graph/badge.svg?token=aYIfVrrCEF)](https://codecov.io/gh/teneplaysofficial/zylog)

## Installation

```sh
npm install zylog
```

## Quick Start

```ts
import zylog, { Zylog } from 'zylog';

zylog.info('Server started');
zylog.warn('Low memory');
zylog.error('Something went wrong');

const log = new Zylog({
  prefix: 'API',
  level: 'debug',
});

log.debug('Request received');
log.success('Connected');
```

## Docs

Full documentation, guides, and API reference: 👉 https://zylog.vercel.app
