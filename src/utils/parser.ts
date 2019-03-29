import { HTMLElement, parse, NodeType } from "node-html-parser";
import { IThreadMeta, IThread } from '../interfaces/thread'

export const homeParser = (html: string) => {
  const dom = parse(html) as HTMLElement

  let bannerElems = dom.querySelectorAll('.slideshow li')
  let bannerThreadList = parseBannerThreadList(bannerElems)

  let indexElems = dom.querySelectorAll('#portal_block_432_content li')
  let indexThreadList = parseIndexThreadList(indexElems)

  let newElems = dom.querySelectorAll('#portal_block_433_content li')
  let newThreadList = parseNewThreadList(newElems)

  let hotElems = dom.querySelectorAll('#portal_block_434_content li')
  let hotThreadList = parseHotThreadList(hotElems)

  return { bannerThreadList, indexThreadList, newThreadList, hotThreadList }
}

const parseBannerThreadList = (elems: HTMLElement[]) => {
  let bannerThreadList = [] as IThreadMeta[]
  elems.forEach(elem => {
    /* Each elem like:
      <li style="width: 432px; height: 289px; display: none;">
        <a href="t476291-1-1" target="_blank">
          <img
          src="https://blob.steamcn.com/block/9d/9d25040d6ea2056324e2ff0e7b6896cf.jpg"
          width="432"
          height="289"
          title="板块: 成就指南
                 作者: k15 (2019-03-27)
                 浏览: 0 / 回复: 0
                 最后: k15 (2019-03-27)">
        </a>
        <span class="title">杀手2新狙击图《鬼港》成就及部分挑战指南</span>
      </li>
    */
    let title = elem.querySelector('span').text
    let image = elem.querySelector('img').attributes.src
    let hrefAttr = elem.querySelector('a').attributes.href
    let url = `https://steamcn.com/${hrefAttr}`
    let tid = parseInt((hrefAttr.match(/t(\d+)/) as RegExpMatchArray)[1])
    let imgTitleLines = elem.querySelector('img').attributes.title.trim().split('\n')
    let section = imgTitleLines[0].substr(4)
    let username = (imgTitleLines[1].match(/:([\S\s]*)\(/) as RegExpMatchArray)[1]
    let viewed = parseInt((imgTitleLines[2].match(/浏览: (\d*) \//) as RegExpMatchArray)[1])
    let replied = parseInt((imgTitleLines[2].match(/回复: (\d*)/) as RegExpMatchArray)[1])

    let meta: IThreadMeta = {
      title,
      image,
      url,
      tid,
      section,
      author: {
        username
      },
      stats: {
        viewed,
        replied
      }
    }
    bannerThreadList.push(meta)
  })
  return bannerThreadList
}


const parseExtraThreadList = (elems: HTMLElement[]) => {
  let extraThreadList = [] as IThreadMeta[]
  elems.forEach(elem => {
    /* Each elem like:
      <li>
        <em>
          <a href="suid-459867" target="_blank">k15</a>
        </em>
        <a href="t476291-1-1"
           title="板块: 成就指南
                  作者: k15 (2019-03-27)
                  浏览: 0 / 回复: 0
                  最后: k15 (2019-03-27)"
           target="_blank">杀手2新狙击图《鬼港》成就及部分挑战指南
        </a>
      </li>
    */
    let userElem = elem.querySelector('em a')
    let username = userElem.text
    let uid = parseInt(userElem.attributes.href.substr(5))
    let avatar = `https://steamcn.com/uc_server/avatar.php?uid=${uid}&size=small`;
    let threadElem = elem.querySelectorAll('a')[1]
    let title = threadElem.text
    let hrefAttr = threadElem.attributes.href
    let url = `https://steamcn.com/${hrefAttr}`
    let tid = parseInt((hrefAttr.match(/t(\d+)/) as RegExpMatchArray)[1])
    let imgTitleLines = threadElem.attributes.title.trim().split('\n')
    let section = imgTitleLines[0].substr(4)
    let viewed = parseInt((imgTitleLines[2].match(/浏览: (\d*) \//) as RegExpMatchArray)[1])
    let replied = parseInt((imgTitleLines[2].match(/回复: (\d*)/) as RegExpMatchArray)[1])

    let meta: IThreadMeta = {
      title,
      url,
      tid,
      section,
      author: {
        username,
        uid,
        avatar
      },
      stats: {
        viewed,
        replied
      }
    }
    extraThreadList.push(meta)
  })
  return extraThreadList
}

const parseIndexThreadList = (elems: HTMLElement[]) => {
  return parseExtraThreadList(elems)
}

const parseNewThreadList = (elems: HTMLElement[]) => {
  return parseExtraThreadList(elems)
}

const parseHotThreadList = (elems: HTMLElement[]) => {
  return parseExtraThreadList(elems)
}


export const threadParser = (html: string): IThread => {
  const dom = parse(html) as HTMLElement
  const content = dom.querySelector('.bm')

  const titleDom = content.querySelector('#thread_subject')
  const title = titleDom.text
  const tid = parseInt((titleDom.attributes.href.match(/tid=(\d+)/) as RegExpMatchArray)[1])

  const statsDom = content.querySelector('.xg1')
  const statsText = statsDom.rawText
  const regArr = statsText.match(/看(\d+)\|回(\d+)/) as RegExpMatchArray
  const viewed = parseInt(regArr[1])
  const replied = parseInt(regArr[2])

  type User = {
    username: string,
    uid: number,
    avatar: string,
    time: string
  }
  const usersInfo = Array<User>()
  const userDoms = dom.querySelectorAll('.bm_user')
  userDoms.forEach(dom => {
    const userLinkTag = dom.querySelector('a')
    const username = userLinkTag.text
    const uid = parseInt((userLinkTag.attributes.href.match(/uid=(\d+)/) as RegExpMatchArray)[1])
    const avatar = `https://steamcn.com/uc_server/avatar.php?uid=${uid}&size=middle`
    const time = dom.querySelector('.xs0.xg1').text
    usersInfo.push({
      username,
      uid,
      avatar,
      time
    })
  })

  const postsContent = Array<string>()
  const postDoms = dom.querySelectorAll('.postmessage')
  postDoms.forEach(dom => {
    // replace low res images with high res images
    dom.querySelectorAll('a').forEach((link) => {
      if (link.childNodes.length > 0 && link.firstChild.nodeType === NodeType.ELEMENT_NODE
        && (link.firstChild as HTMLElement).tagName === 'img') {
        const parent = link.parentNode as HTMLElement
        const newNode = new HTMLElement('img', {}, `src=${link.attributes.href}`)
        parent.exchangeChild(link, newNode)
      }
    })
    postsContent.push(normalizeHTML(dom.innerHTML))
  })

  const replies = Array<{
    user: {
      username: string,
      uid: number,
      avatar: string
    },
    content: string
    time: string
  }>()

  for (let i = 1; i < usersInfo.length && i < postsContent.length; i++) {
    replies.push({
      user: {
        username: usersInfo[i].username,
        uid: usersInfo[i].uid,
        avatar: usersInfo[i].avatar
      },
      content: postsContent[i],
      time: usersInfo[i].time
    })
  }

  return {
    title,
    tid,
    time: usersInfo[0].time,
    viewed,
    replied,
    content: postsContent[0],
    author: {
      username: usersInfo[0].username,
      uid: usersInfo[0].uid,
      avatar: usersInfo[0].avatar
    },
    replies
  }
}

const normalizeHTML = (htmlStr: string) => {
  htmlStr = htmlStr.replace(/\sxmlns="http:\/\/www.w3.org\/1999\/xhtml"/g, ''); // 去掉xmlns
  htmlStr = htmlStr.replace(/[\r\n]/g, ''); //去掉回车换行
  htmlStr = htmlStr.replace(/(<br \/>){2,}/g, '<br/><br/>'); //去多余换行
  htmlStr = htmlStr.replace(/src="forum\.php/g, 'src="https://steamcn.com/forum.php'); //相对地址添加域名
  htmlStr = htmlStr.replace(/src="static/g, 'src="https://steamcn.com/static');
  htmlStr = htmlStr.replace(/href="forum\.php/g, 'href="https://steamcn.com/forum.php');
  htmlStr = htmlStr.replace(/font size="7"/g, 'font size="6"'); // 最大字号为 6
  htmlStr = htmlStr.replace(/color="#ff00"/g, 'color=#ff0000'); // 更改红色Hex，否则无法显示
  // htmlStr = htmlStr.replace(/&amp;/g, '&'); // 转义实体符
  htmlStr = htmlStr.replace(/<iframe src="https:\/\/store.steampowered.com\/widget\/\d+\/" style="border:none;height:190px;width:100%;max-width:646px;"><\/iframe>/g, '') //去掉 Steam Widget
  htmlStr = htmlStr.trim();
  return htmlStr;
}