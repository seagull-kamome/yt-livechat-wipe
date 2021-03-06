// ==UserScript==
// @name        Wipe junk chats out from Youtube Livechat
// @namespace   YoutubeLivechatWipeSpam
// @description Wipe junk messages out.
// @author      HATTORI, Hiroki
// @match       https://www.youtube.com/live_chat*
// @version     1.0.4
// @updateURL   https://raw.githubusercontent.com/seagull-kamome/yt-livechat-wipe/main/yt-livechat-wipe.user.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/js/toastr.min.js
// @resource    toastrCSS https://cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/css/toastr.min.css
// @grant       GM_addStyle
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_getResourceText
// ==/UserScript==
(function () {
  'use strict';

  const MESSAGE_RATE_LIMIT_10 = 5;
  const MESSAGE_RATE_LIMIT_20 = 4;
  const MESSAGE_RATE_LIMIT_60 = 6;

  const MESSAGE_BLOCK_RATE_LIMIT_10 = 7;
  const MESSAGE_BLOCK_RATE_LIMIT_20 = 8;
  const MESSAGE_BLOCK_RATE_LIMIT_60 = 10;

  /* ********************************************************************** */
  const photouri_regexp = new RegExp(
   '^https://yt3.ggpht.com/(?:([^/]*)/AAAAAAAAAAI/AAAAAAAAAAA/([^/]*)/.*/photo\.jpg$'
                        + '|((?:a|ytc)/[^/=]+)=)');
  const emoji_regexp = new RegExp(
    '[\u2700-\u27BF]'
    + '|[\uE000-\uF8FF]'
    + '|\uD83C[\uDC00-\uDFFF]'
    + '|\uD83D[\uDC00-\uDFFF]'
    + '|[\u2011-\u26FF]'
    + '|\uD83E[\uDD10-\uDDFF]', 'g');

  const ALLOWED_EMOJI_LIMIT = 10;

  /* ********************************************************************** */
  // Manupukate configuration.
  let config = {
      bann_words: GM_getValue('YTLW_BANN_WORDS') || '',
      bann_words_regexp: null,

      maximum_timestamp: 0,
      inspected_accounts: { },
      inspected_members: { },

      detected_spammers: { },
    };

  const fix_config = () => {
      config.bann_words_regexp = new RegExp(
        config.bann_words.replace(/\r?\n/g, '|'), 'i');

      // Save bann list.
      GM_setValue('YTLW_BANN_WORDS', config.bann_words);
      GM_setValue('YTLW_BANN_ACCOUNTS',
        Object.keys(config.inspected_accounts).filter(x => config.inspected_accounts[x].typ === 'BANN').join("\n") );
      GM_setValue('YTLW_SAFE_ACCOUNTS',
        Object.keys(config.inspected_accounts).filter(x => config.inspected_accounts[x].typ === 'SAFE').join("\n") );
    };
  fix_config();


  const get_author_info = k => {
      if (! (k in config.inspected_accounts)) {
        var tmp = { typ: 'NUTRAL', timestamps: {} };
        config.inspected_accounts[k] = tmp;
        return tmp;
      }
      return config.inspected_accounts[k];
    };

  (GM_getValue('YTLW_BANN_ACCOUNTS')||'').split(/\r?\n/g)
    .forEach(x => { get_author_info(k).typ = 'BANN'; });
  (GM_getValue('YTLW_SAFE_ACCOUNTS')||'').split(/\r?\n/g)
    .forEach(x => { get_author_info(k).typ = 'SAFE'; });


 /* ********************************************************************** */
  // Inject stylesheet.
  GM_addStyle(GM_getResourceText('toasterCSS'));
  GM_addStyle(`
.ytlw-panel {
  background-color: var(--yt-live-chat-vem-background-color);
  width: auto;
  height: auto;
  z-index: 5;
  display: block;
  visibility: hidden;
  position: absolute;
  bottom: 35px;
  right: 10px;
  padding: 10px;
  color: var(--yt-live-chat-primary-text-color);
  font-size: 14px;
}
.tylw-panel-box {
  width: 210px; float: left; padding-left: 5px;
}
.ytlw-button {
  display: inline-block;
  border-style: none;
  z-index: 4;
  font-weight: 500;
  color: var(--yt-spec-text-secondary);
}
.toast { font-size: 14px; }

.ytlw-guest-hidden yt-live-chat-item-list-renderer
yt-live-chat-text-message-renderer[author-type='']:not(.ytlw-safe-accounts) { display: none!important; }
.ytlw-member-hidden yt-live-chat-item-list-renderer
yt-live-chat-text-message-renderer[author-type='member']:not(.ytlw-safe-accounts) { display: none!important; }
.ytlw-moderator-hidden yt-live-chat-item-list-renderer
yt-live-chat-text-message-renderer[author-type='moderator'] { display: none!important; }
.ytlw-owner-hidden yt-live-chat-item-list-renderer
yt-live-chat-text-message-renderer[author-type='owner'] { display: none!important; }

.ytlw-superchat-hidden yt-live-chat-item-list-renderer
yt-live-chat-paid-message-renderer { display: none!important; }
.ytlw-superstiker-hidden yt-live-chat-item-list-renderer
yt-live-chat-paid-sticker-renderer { display: none!important; }
.ytlw-membership-hidden yt-live-chat-item-list-renderer
yt-live-chat-membership-item-renderer { display: none!important; }

.ytlw-banned-words-hidden yt-live-chat-item-list-renderer .ytlw-bann-words { display: none!important; }
.ytlw-banned-account-hidden yt-live-chat-item-list-renderer .ytlw-bann-accounts { display: none!important; }
.ytlw-deleted-message-hidden yt-live-chat-item-list-renderer
yt-live-chat-text-message-renderer[is-deleted] { display: none!important; }

.ytlw-excess-emoji-hideen yt-live-chat-item-list-renderer
yt-live-chat-text-message-renderer[author-type=''].ytlw-excess-emoji { display: none!important; }
.ytlw-spoofing-hidden yt-live-chat-item-list-renderer .ytlw-spoofing { display: none!important; }

.ytlw-highrate-10-hidden yt-live-chat-item-list-renderer .ytlw-highrate-10 { display: none!important; }
.ytlw-highrate-20-hidden yt-live-chat-item-list-renderer .ytlw-highrate-20 { display: none!important; }
.ytlw-highrate-60-hidden yt-live-chat-item-list-renderer .ytlw-highrate-60 { display: none!important; }

ul.ytlw-dropdownmenu { list-style: none; overflow: none; }
ul.ytlw-dropdownmenu > li { display: inline-block; padding: 0 1ex 0 1ex;
   border:1px solid black; position: relative; }
ul.ytlw-dropdownmenu > li.ytlw-accept-drragndrop:-moz-drag-over { border 1px solid green; }

ul.ytlw-dropdownmenu > li > ul { position: absolute;
  left: 0; list-style: none; display: none; overflow: none; }
ul.ytlw-dropdownmenu > li > ul > li { mergin: 0 1ex 0 1ex; padding: 0 1ex 0 1ex; }
ul.ytlw-dropdownmenu > li > ul > li:hover { border: black 1px solid: }
ul.ytlw-dropdownmenu > li:hover > ul { display: block; }

`);


  /* ********************************************************************** */
  // Message inspector
  const chatmessage_inspector = async (rescan, x) => {
    const xx = x.__data.data; // just for shorthand

    //
    // Query author info.
    //
//    const author_photo_uri = author_photo.getAttribute('src') || '';
//    const author_name = x.querySelector('#author-name').innerText;
    const author_photo_uri = xx.authorPhoto.thumbnails[0].url || '';
    const author_name = xx.authorName.simpleText || '';
    const author_key = xx.authorExternalChannelId || (y => {
      console.log('no channel id of ' + author_name + ' : ' + author_photo_uri);
      if (!y) { console.log('Unknown photo uri:' + author_photo_uri); }
      else { return author_name + '/' + (y[1]||y[3]) + '/' + (y[2]||'') }
    })(author_photo_uri.match(photouri_regexp));
    const is_guest = (('authorBadges' in xx) && xx.authorBadges.length > 0)?  false : false;

    let author_info = get_author_info(author_key);
    x.classList.toggle('ytlw-bann-accounts', (author_info.typ === 'BANN'));
    x.classList.toggle('ytlw-safe-accounts', (author_info.typ === 'SAFE'));

    //
    // Detect high rate posts.
    //
    const timestamp_10sec = Math.floor(xx.timestampUsec / 10000);
    if (timestamp_10sec > config.maximum_timestamp)
      config.maximum_timestamp = timestamp_10sec;

    let author_timestamps = author_info.timestamps;
    if (!rescan && is_guest && x.nodeName.toLowerCase() !== 'yt-live-chat-paid-message-renderer') {
      // update timestamps
      author_timestamps[timestamp_10sec] = (author_timestamps[timestamp_10sec] || 0) + 1;
    }

    const rate_10 = (author_timestamps[timestamp_10sec] || 0);
    const rate_20 = rate_10 + (author_timestamps[timestamp_10sec - 1] || 0);
    const rate_60 = rate_20
                  + (author_timestamps[timestamp_10sec - 2] || 0)
                  + (author_timestamps[timestamp_10sec - 3] || 0)
                  + (author_timestamps[timestamp_10sec - 4] || 0)
                  + (author_timestamps[timestamp_10sec - 5] || 0);
    x.classList.toggle('ytlw-highrate-10', rate_10 > MESSAGE_RATE_LIMIT_10);
    x.classList.toggle('ytlw-highrate-20', rate_20 > MESSAGE_RATE_LIMIT_20);
    x.classList.toggle('ytlw-highrate-60', rate_60 > MESSAGE_RATE_LIMIT_60);


    //
    // Detect Spoofing.
    //
    if (! is_guest && !(author_name in config.inspected_members)) {
        console.log('Found member : ' + author_name + ' (' + author_key + ')');
        config.inspected_members[author_name] = { key: author_key };
    }
    const is_spoofing = (author_name in config.inspected_members)? is_guest : false;
    x.classList.toggle('ytlw-spoofing', is_spoofing);



    // Queue the spammer's channel to block.
    if (is_spoofing
      || rate_10 >= MESSAGE_BLOCK_RATE_LIMIT_10
      || rate_20 > MESSAGE_BLOCK_RATE_LIMIT_20) {
      config.detected_spammers[author_key] = {
        msgid: xx.id,
        param: xx.contextMenuEndpoint.liveChatItemContextMenuEndpoint.param };
    }

//    const message = x.querySelector('#message').innerText;
    const message = xx.message.runs.map(y => y.text || '').join('');
    const sanity_msg = message.replace(emoji_regexp, '');
//    console.log(author_name + '\n' + sanity_msg + '\n' + message);

    // Detect BANN words
    x.classList.toggle('ytlw-bann-words',   // test BANN words.
      (!!config.bann_words_regexp && config.bann_words !== ''
       && config.bann_words_regexp.test(author_name + '\n' + sanity_msg + '\n' + message)) );

    // Detect excess Emoji
    x.classList.toggle('ytlw-excess-emoji', (message.length - sanity_msg.length > ALLOWED_EMOJI_LIMIT));


    //
    // Enable drag
    //
    const author_photo = x.querySelector('#author-photo > img');
    author_photo.ondragstart = e => {
        e.dataTransfer.setData('text/ytlw-author-key', author_key);
        e.dataTransfer.setData('text/plain', author_key);
        e.dataTransfer.setData('text/uri-list', author_photo_uri);
      };

    //
    // Enable click
    //
    author_photo.addEventListener('click', e => {
        document.getElementById('ytlw-author-info-name').innerText = author_name;
        document.getElementById('ytlw-author-channel').setAttribute('href',
          'https://youtube.com/channel/' + xx.authorExternalChannelId);
        document.getElementById('ytlw-author-info-detail').innerText =
          (author_info.typ||'')
          + ' - ' + ((author_key in config.detected_spammers)? 'SPAMMER':'');
      });

    };
  const force_inspect_all_messages = () => {
      document.querySelectorAll('yt-live-chat-text-message-renderer, yt-live-chat-paid-message-renderer')
        .forEach(x => chatmessage_inspector(true, x));
    };

  (new MutationObserver(xs => {
    xs.forEach(x => {
        x.addedNodes.forEach(y => {
            const nodename = y.nodeName.toLowerCase();
            if (nodename == 'yt-live-chat-text-message-renderer'
              || nodename == 'yt-live-chat-paid-message-renderer') {
              chatmessage_inspector(false, y);
            }
          });
      });
    })).observe(document.querySelector('yt-live-chat-app')
                , { childList: true, subtree: true });



  /* ********************************************************************** */
  // House keeping
  const HOUSE_KEEPING_INTERVAL_MS = 600 * 1000;
  const house_keeper = () => {
    Object.keys(config.inspected_accounts).forEach(k => {
      let x = config.inspected_accounts[k];
      if ('timestamps' in x) {
        Object.keys(x.timestamps)
          .filter(t => t < config.maximum_timestamp - (30 * 6))
          .forEach(t => delete x.timestamps[t]);
      }
    });
    window.setTimeout(house_keeper, HOUSE_KEEPING_INTERVAL_MS);
  };
  window.setTimeout(house_keeper, HOUSE_KEEPING_INTERVAL_MS);


  /* ********************************************************************** */
  // Inject popup menu
  const popuphtml = `
<div class='ytlw-settings'>
  <div class='ytlw-panel' id='ytlw-setting-panel'>
    <div class='ytlw-panel-box'>
      <div>
        <p><spam>Drop user icon to categolize:</span></p>
      </dov>
      <div>
        <ul class='ytlw-dropdownmenu'>
          <li class='ytlw-bann-button ytlw-accept-dragndrop' ytlw-bann-type='BANN'>BANN
            <ul><!-- li id='ytlw-cmd-show-bann-accounts' Show /li -->
                <li id='ytlw-cmd-reset-bann-accounts'>Reset</li></ul><//li>
          <li class='ytlw-bann-button ytlw-accept-dragndrop' ytlw-bann-type='NUTRAL'>NUTRAL</li>
          <li class='ytlw-bann-button ytlw-accept-drawndrop' ytlw-bann-type='SAFE'>SAFE
            <ul><!-- li id='ytlw-cmd-show-safe-accounts' Show /li -->
                <li id='ytlw-cmd-reset-safe-accounts'>Reset</li></ul></li>
        </ul>
      </div>
      <div>
        <p><span>Hide by message type:</spam></p>
      </div>
      <div id='ytlw-popup-hide-by-member-type'>
        <input type='checkbox' name='guest' checked='checked' />Guest
        <input type='checkbox' name='member' checked='checked' />Member
        <input type='checkbox' name='moderator' checked='checked' />Moderator
        <input type='checkbox' name='owner' checked='checked' />Owner <br />
        <input type='checkbox' name='superchat' checked='checked' />Super Chat
        <input type='checkbox' name='supersticker' checked='checked' />Super Sticker
        <input type='checkbox' name='membership' checked='checked' />Membership <br />
        <input type='checkbox' name='banned-account' checked='checked' />Banned account
        <input type='checkbox' name='banned-words' checked='checked' />Banned word
        <input type='checkbox' name='deleted-message' checked='checked' />Deleted<br />
        <input type='checkbox' name='excess-emoji' checked='checked' />Excess emojis
        <input type='checkbox' name='spoofing' checked='checked' />Spoofing<br />
        <input type='checkbox' name='highrate-10' checked='checked' />Over ${MESSAGE_RATE_LIMIT_10} posts in 10 sec. <br />
        <input type='checkbox' name='highrate-20' checked='checked' />Over ${MESSAGE_RATE_LIMIT_20} posts in 20 sec. <br />
        <input type='checkbox' name='highrate-60' checked='checked' />Over ${MESSAGE_RATE_LIMIT_60} posts in 60 sec. <br />
      </div>
      <div>
        <p>
          <span>Bann words: (regexp)</span>
          <button id='ytlw-popup-apply'>Save</button>
        </p>
      </div>
      <div>
        <textarea id='ytlw-popup-bannwords' rows='4' style='resize:holizontal; width:100%;'></textarea>
      </div>
      <div>
        <p>
          Author info of
          <a id='ytlw-author-channel' target='_blank' href='#'>
            <span id='ytlw-author-info-name'></span>
          </a> .
        </p>
        <p id='ytlw-author-info-detail'></p>
      </div>
    </div>
  </div>
</div>
<button type='button' name='panelbutton' value='panelbutton' class='ytlw-button'
    id='ytlw-setting-button'
    style="white-space: nowrap;">
  <span>[Filter]</span>
</button>`

  const refbtn = document.querySelector(
    '#chat-messages > yt-live-chat-header-renderer > yt-icon-button');
  if (!refbtn) { return ; }
  refbtn.insertAdjacentHTML('beforebegin', popuphtml);

  const popup = document.getElementById('ytlw-setting-panel');
  const bann_word_textarea = popup.querySelector('#ytlw-popup-bannwords');
  document.getElementById('ytlw-setting-button').addEventListener('click', () => {
      // when popup button pressed, popup the panel.
      bann_word_textarea.value = config.bann_words;
      popup.style.visibility = (popup.style.visibility == 'visible')? 'hidden' : 'visible';
    });

  // Setting actions.
  document.querySelectorAll("#ytlw-popup-hide-by-member-type input[type='checkbox']")
    .forEach(x => {
        // when member type filter changed.
        const c = 'ytlw-' + x.name + '-hidden';
        x.onchange = () => { document.body.classList.toggle(c, !x.checked); }; });
  document.getElementById('ytlw-popup-apply').addEventListener('click', x => {
      // when "Save" pressed.
      config.bann_words = bann_word_textarea.value;
      fix_config();
      force_inspect_all_messages(); });

  // Bann button
  document.querySelectorAll('.ytlw-bann-button')
    .forEach(elm => {
       const typ = elm.getAttribute('ytlw-bann-type') || 'ERROR';
       elm.addEventListener('dragover', e => {
         e.preventDefault();
         e.stopPropagation();
         e.dataTransfer.dropEffect = 'copy'; });
       elm.addEventListener('drop',e => {
          const k = e.dataTransfer.getData('text/ytlw-author-key');
          if (!k) { return; }

          e.stopPropagation();
          e.preventDefault();
          if (typ === 'BANN' || typ == 'SAFE' || typ == 'NUTRAL') {
            config.inspected_accounts[k].typ = typ;
          } else { return ; }

          fix_config();
          force_inspect_all_messages(); // Update view
        });
    });

  const do_cmd_reset_account_list = k => () => {
      Object.keys(config.inspected_accounts).forEach(x => {
          if (config.inspected_accounts[x].typ === k) {
            config.inspected_accounts[k].typ = 'NUTRAL'; } }); };
  document.querySelector('#ytlw-cmd-reset-bann-accounts')
    .addEventListener('click', do_cmd_reset_account_list('BANN'));
  document.querySelector('#ytlw-cmd-reset-safe-accounts')
    .addEventListener('click', do_cmd_reset_account_list('SAFE'));

  force_inspect_all_messages();
})();

