#!/bin/zsh
cd -- "${0:A:h}"
exec caffeinate -i node server.mjs
