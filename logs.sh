#!/bin/bash

journalctl -u camera-watcher.service -u camera-folder-watcher.service -f
