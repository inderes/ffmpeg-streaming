# Stream mp4 files (using nodejs and ffmpeg)

To stream parts of the file, use start and/or parameters like:

```
http://localhost:3000/video.mp4?start=10&end=120
```

App tries to find .mp4 files from the data directory. In docker, map the volume to:

```
/from/host/videodir:/opt/node_app/app/data
```

Other env vars you can set:

- `PORT` (defaults to 3000)
- `DEBUG=ffmpegstreamer:*` (or `DEBUG=ffmpegstreamer:*,ffmpegstreamerstderr:*` to get the ffmpeg's stderr output)