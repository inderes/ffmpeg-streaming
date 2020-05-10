// Require the framework and instantiate it
const debug = require('debug')('ffmpegstreamer:server');
const debugStderr = require('debug')('ffmpegstreamerstderr:server');
const debugErr = require('debug')('ffmpegstreamer:server:error');
const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const fsPromises = fs.promises;

const app = express();
const port = process.env.PORT || 3000;

app.use(async (req, res) => {

  const pathParsed = path.parse(req.path);

  if (pathParsed.ext !== '.mp4') {
    debugErr('Not .mp4');
    debugErr('ParsedPath: %o', pathParsed);
    return res.sendStatus(404);
  }

  const { start, end } = req.query;

  let duration = false;

  if (start && end) {
    duration = end - start;
  }

  const dirName = dir => dir === '/' ? dir : dir + '/';
  const dir = './data' + dirName(pathParsed.dir);
  const fullPath = `${dir}${pathParsed.base}`;

  try {
    await fsPromises.access(fullPath, fs.constants.R_OK);
  } catch (error) {
    debugErr('Could not find file: %s', fullPath);
    debugErr('ParsedPath: %o', pathParsed);
    return res.sendStatus(404);
  }

  // Build ffmpeg command

  const opts = [];

  if (start) opts.push('-ss', parseInt(start));
  opts.push('-i', fullPath);
  opts.push('-movflags', 'frag_keyframe+empty_moov+delay_moov');
  if (duration) opts.push('-t', duration);

  const finalOpts = [
    ...opts,
    '-codec', 'copy',
    '-avoid_negative_ts', '1',
    '-f', 'mp4',
    '-'
  ];

  const ffmpeg = spawn('ffmpeg', finalOpts);

  ffmpeg.on('exit', () => res.end());

  ffmpeg.stderr.on('data', function (data) {
    debugStderr('stderr: %s', data);
  });

  res.setHeader('Content-Type', 'video/mp4');

  debug('Started to stream file "%s" Start: %s, End: %s', fullPath, start, end);

  ffmpeg.stdout.pipe(res);
})

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

app.on('error', onError);

app.listen(port, () => debug(`Ffmpeg streamer app listening at http://${process.env.HOSTNAME || 'localhost'}:${port}`))
