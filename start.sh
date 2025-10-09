#!/bin/bash
npm i

sudo chown -R $(whoami) /home/pi/images

sudo systemctl stop camera-folder-watcher
sudo systemctl stop camera-watcher

sudo cp camera-folder-watcher.service /lib/systemd/system/camera-folder-watcher.service
sudo cp camera-watcher.service /lib/systemd/system/camera-watcher.service

sudo systemctl daemon-reload

sudo systemctl enable camera-folder-watcher
sudo systemctl enable camera-watcher

sudo systemctl start camera-folder-watcher
sudo systemctl start camera-watcher
