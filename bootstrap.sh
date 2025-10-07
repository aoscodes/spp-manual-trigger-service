#! bin/bash

npm i

cp camera-folder-watcher.service /lib/systemd/system/camera-folder-watcher.service
cp camera-watcher.service /lib/systemd/system/camera--watcher.service

sudo systemctl daemon-reload
sudo systemctl start camera-folder-watcher
sudo systemctl start camera-watcher
