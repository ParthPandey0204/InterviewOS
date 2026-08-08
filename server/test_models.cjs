const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const keyMatch = env.match(/GEMINI_API_KEY=\"?(.*?)\"?$/m);
if (keyMatch) {
  fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + keyMatch[1])
    .then(r => r.json())
    .then(data => {
      if (data.models) {
        console.log(data.models.map(m => m.name).join('\n'));
      } else {
        console.log(data);
      }
    });
} else {
  console.log("No key found");
}
