import axios from 'axios'

async function ymCDN(url, format = 'mp3') {
	return new Promise(async (resolve, reject) => {
		const isYouTubeUrl = /^(?:(?:https?:)?\/\/)?(?:(?:(?:www|m(?:usic)?)\.)?youtu(?:\.be|be\.com)\/(?:shorts\/|live\/|v\/e(?:mbed)?\/|watch(?:\/|\?(?:\S+=\S+&)*v=)|oembed\?url=https?%3A\/\/(?:www|m(?:usic)?)\.youtube\.com\/watch\?(?:\S+=\S+&)*v%3D|attribution_link\?(?:\S+=\S+&)*u=(?:\/|%2F)watch(?:\?|%3F)v(?:=|%3D))?|www\.youtube-nocookie\.com\/embed\/)(([\w-]{11}))[\?&#]?\S*$/
		if (!isYouTubeUrl.test(url)) return resolve({ status: false, mess: "URL YouTube tidak valid." })
		const id = url.match(isYouTubeUrl)?.[2]
		const hr = {
			'Accept': 'application/json, text/plain, */*',
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin': '*',
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
			'Referer': 'https://id.ytmp3.mobi/',
		}
		try {
			const init = await axios.get(`https://d.ymcdn.org/api/v1/init?p=y&23=1llum1n471&_=${Math.random()}`, { headers: hr })
			if (!init.data.convertURL) return resolve({ status: false, mess: "Gagal memulai konversi." })
			const convert = await axios.get(`${init.data.convertURL}&v=${id}&f=${format}&_=${Math.random()}`, { headers: hr }).then(x => x.data)
			if (!convert.progressURL || !convert.downloadURL) return resolve({ status: false, mess: "Gagal mendapatkan URL." })
			let currentProgress = 0
			let title = ''
			while (currentProgress < 3) {
				const response = await axios.get(convert.progressURL, { headers: hr })
				const data = response.data
				if (data.error > 0) return resolve({ status: false, mess: `Error server: ${data.error}` })
				currentProgress = data.progress
				title = data.title
				if (currentProgress < 3) await new Promise(resolve => setTimeout(resolve, 300))
			}
			resolve({ status: true, title: title, dl: convert.downloadURL, id: id })
		} catch (error) {
			resolve({ status: false, mess: 'Kesalahan komunikasi server konversi.' })
		}
	})
}

async function youtubeDl(url) {
	try {
		const [mp4, mp3] = await Promise.all([ymCDN(url, 'mp4'), ymCDN(url, 'mp3')])
		if (!mp4.status && !mp3.status) throw new Error(mp4.mess || "Gagal mengambil data YouTube.")
		const results = []
		if (mp4.status) results.push({ quality: 'HD', type: 'mp4', url: mp4.dl })
		if (mp3.status) results.push({ quality: '128kbps', type: 'mp3', url: mp3.dl })
		const primary = mp4.status ? mp4 : mp3
		return {
			title: primary.title,
			preview: `https://i.ytimg.com/vi/${primary.id}/hqdefault.jpg`,
			results: results
		}
	} catch (e) {
		throw new Error("Gagal mengambil data YouTube.")
	}
}

export { youtubeDl }
