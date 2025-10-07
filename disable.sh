#!/bin/bash

sudo systemctl daemon-reload

sudo systemctl disable camera-folder-watcher
sudo systemctl disable camera-watcher

sudo systemctl stop camera-folder-watcher
sudo systemctl stop camera-watcher
