#! /bin/bash
echo "compiling eventwhen"
literate-programming eventwhen.md
echo "compiling tests"
cd test
node ../node_modules/.bin/literate-programming test.md
echo "testing"
node testrunner.js
rc=$?
echo "done"
cd ..
exit $rc
# use with nodemon -e md --ignore *.js --ignore README.md --ignore TODO.md --exec ./mon.sh
# make sure mon.sh is executable: chmod +x mon.sh
