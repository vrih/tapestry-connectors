function getData(path) {
  const headers = {"X-Api-Key": apiKey, "accept": "application/json"};
  return sendRequest(path, "GET", null, headers);
}

function load(){
  let date = new Date();
  date.setDate(date.getDate() - 1);
  const endpoint = site + "/api/v3/history/since?eventType=downloadFolderImported&date=" + date.toISOString();
  getData(endpoint)
    .then((text) => JSON.parse(text))
    .then((json) => {
      const items = json.map((el) => {
        return getData(site + "/api/v3/episode/" + el.episodeId)
          .then((response) => { 
            const d = JSON.parse(response);
            let elDate = new Date(el.date);
            let elUri = endpoint + `&id=${el.id}`;
            let item = Item.createWithUriDate(elUri, elDate)
            item.title = `${d.series.title} - ${d.title} S${d.seasonNumber}E${d.episodeNumber}`
            item.body = `<p>${d.overview}</p>`

            if(d.images[0].remoteUrl != undefined) {
              let mediaAttachment = MediaAttachment.createWithUrl(d.images[0].remoteUrl);
              item.attachments = [mediaAttachment];
            }
            return item;
          })
      });
      return Promise.all(items);
    })
    .then((items) => {
      processResults(items);
    })
    .catch((requestError) => {
      processError(requestError);
    });



}

function verify(){
  verifyAsync().then(processVerification).catch(processError)

}

async function verifyAsync() {
  const url = `${site}/api/v3/ping`
  const check = JSON.parse(await getData(url))
  // all we need to know is that getting data didn't fail
  return "Healthchecks"
}

