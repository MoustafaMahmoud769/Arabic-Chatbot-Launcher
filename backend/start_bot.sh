#!/bin/bash
# To run: bash make_bot.sh <bot_name>
# set -x

BOT=$1

if ! [ -d "$BOT" ]; then
  echo 'Bot does not exist'; exit
fi

cd $BOT && make server
