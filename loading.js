require("colors");
const { stdout } = require("single-line-log");

function wait(time) {
  return new Promise(res => setTimeout(res, time));
}
let flag = true;
module.exports = {
  start: () => {
    flag = true;
    module.exports.loading()
  },
  loading: async function() {
    while (flag) {
      stdout('-');
      await wait(200);
      stdout('\\');
      await wait(200);
      stdout('|');
      await wait(200);
      stdout('/');
      await wait(200);
    }
    if(!flag) {
      stdout('')
    }
  },
  stop: () => {
    flag = false;
  }
};



