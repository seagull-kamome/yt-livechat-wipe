// ==UserScript==
// @name        Wipe junk chats out from Youtube Livechat
// @namespace   YoutubeLivechatWipeSpam
// @description Wipe junk messages out.
// @author      HATTORI, Hiroki
// @match       https://www.youtube.com/live_chat*
// @version     1.0.2
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

  /* ********************************************************************** */
  const photouri_regexp = new RegExp(
    '^https://yt3.ggpht.com/([^/]*)/AAAAAAAAAAI/AAAAAAAAAAA/([^/]*)/.*/photo\.jpg$');

  /* ********************************************************************** */
  // Manupukate configuration.
  let config = {
      bann_words: GM_getValue('YTLW_BANN_WORDS') || '',
      bann_words_regexp: null,

      inspected_accounts: { },
    };
  (GM_getValue('YTLW_BANN_ACCOUNTS')||'').split(/\r?\n/g).forEach(
      x => { config.inspected_accounts[x] = 'BANN'; });

  const fix_config = () => {
      config.bann_words_regexp = new RegExp(
        config.bann_words.replace(/\r?\n/g, '|'), 'i');

      GM_setValue('YTLW_BANN_WORDS', config.bann_words);
    };
  fix_config();


 /* ********************************************************************** */
  // Inject stylesheet.
  GM_addStyle(GM_getResourceText('toasterCSS'));
  GM_addStyle(`
.ytlw-panel {
  background-color: rgba(30,30,30,0.9);
  width: auto;
  height: auto;
  z-index: 5;
  display: inline-block;
  visibility: hidden;
  position: absolute;
  bottom: 35px;
  right: 10px;
  padding: 10px;
  color: #fff;
  font-size: 14px;
}
.tylw-panel-box { width: 210px; float: left; padding-left: 5px; }
.ytlw-button {
  display: inline-block;
  border-style: none;
  z-index: 4;
  font-weight: 500;
  color: var(--yt-spec-text-secondary);
}
.ytlw-ngbutton { fill: #fff; }
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

#ytlw-bann-button:-moz-drag-over { border: 1px solid black; }
`);


  /* ********************************************************************** */
  // Message inspector
  const chatmessage_inspector = async x => {
      x.classList.remove('ytlw-bann-words', 'ytlw-bann-accounts', 'ytlw-safe-accounts');

      // Extract author information, and check it.
      const author_photo = x.querySelector('#author-photo > img');
      const author_photo_uri = author_photo.getAttribute('src') || '';
      const author_name = x.querySelector('#author-name').innerText;
      const author_key = (y => author_name + '/' + y[1] + '/' + y[2])(author_photo_uri.match(photouri_regexp));
      if (config.inspected_accounts[author_key] === 'BANN') {
        x.classList.add('ytlw-bann-accounts');
      } else if (config.inspected_accounts[author_key] === 'SAFE') {
        x.classList.add('ytlw-safe-accounts');
      }

      // Extract message text, and check it.
      const post_time = x.querySelector('#timestamp').innerText;
      const message = x.querySelector('#message').innerText;
      if (!!config.bann_words_regexp && config.bann_words != ''
       && (config.bann_words_regexp.test(author_name) || config.bann_words_regexp.test(message)) ) {
        x.classList.add('ytlw-bann-words');
      }

      // Enable drag
      author_photo.ondragstart = e => {
          e.dataTransfer.setData('text/plain', author_name);
          e.dataTransfer.setData('text/uri-list', author_photo_uri);
        };
    };
  const force_inspect_all_messages = () => {
      document.querySelectorAll('yt-live-chat-text-message-renderer, yt-live-chat-paid-message-renderer')
        .forEach(chatmessage_inspector);
    };
  force_inspect_all_messages();

  (new MutationObserver(xs => {
    xs.forEach(x => {
        x.addedNodes.forEach(y => {
            const nodename = y.nodeName.toLowerCase();
            if (nodename == 'yt-live-chat-text-message-renderer'
              || nodename == 'yt-live-chat-paid-message-renderer') {
              chatmessage_inspector(y);
            }
          });
      });
    })).observe(document.querySelector('yt-live-chat-app')
                , { childList: true, subtree: true });


  /* ********************************************************************** */
  // Inject popup menu
  const popuphtml = `
<button type='button' name='bannbutton' value='bannbutton'
    class='ytlw-button ytlw-bann-button' ytlw-bann-type='BANN'
    style="background: rgba(0,0,0,0);margin-left: 10px;white-space: nowrap;">
  <span>[BANN]</span>
</button>

<div class='ytlw-settings'>
  <div class='ytlw-panel' id='ytlw-setting-panel'>
    <div class='ytlw-panel_box'>
      <div>
        <span>Hide by message type:</spam>
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
        <input type='checkbox' name='deleted-message' checked='checked' />Deleted
      </div>
      <div>
        <span>Bann words: (regexp)</span>
      </div>
      <div>
        <textarea id='ytlw-popup-bannwords' rows='4' style='resize:holizontal; width:100%;'></textarea>
      </div>
      <div>
        <button id='ytlw-popup-apply'>Save</button>
      </div>
      <div>
        <spam>Drop user icon to categolize:</span>
      </dov>
      <div>
        <span class='ytlw-bann-button' ytlw-bann-type='BANN'>[BANN}</span>
        : <span class='ytlw-bann-button' ytlw-bann-type='NUTRAL'>[NUTRAL]</span>
        : <span class='ytlw-bann-button' ytlw-bann-type='SAFE'>[SAFE]</span>
      </div>
      </div>
    </div>
  </div>
</div>
<button type='button' name='panelbutton' value='panelbutton' class='ytlw-button'
    id='ytlw-setting-button'
    style="background: rgba(0,0,0,0); white-space: nowrap;">
  <span>[Filter]</span>
</button>`

  const refbtn = document.querySelector(
    '#chat-messages > yt-live-chat-header-renderer > yt-icon-button');
  if (!refbtn) { return ; }
  refbtn.insertAdjacentHTML('beforebegin', popuphtml);

  const popup = document.getElementById('ytlw-setting-panel');
  const bann_word_textarea = popup.querySelector('#ytlw-popup-bannwords');
  document.getElementById('ytlw-setting-button').onclick = () => {
      // when popup button pressed, popup the panel.
      bann_word_textarea.value = config.bann_words;
      popup.style.visibility = (popup.style.visibility == 'visible')? 'hidden' : 'visible';
    };

  // Setting actions.
  document.querySelectorAll("#ytlw-popup-hide-by-member-type input[type='checkbox']")
    .forEach(x => {
        // when member type filter changed.
        const c = 'ytlw-' + x.name + '-hidden';
        x.onchange = () => {
            if (x.checked) {
              document.body.classList.remove(c);
            } else {
              document.body.classList.add(c);
            } }; });
  document.getElementById('ytlw-popup-apply').onclick = x => {
      // when "Apply" pressed.
      config.bann_words = bann_word_textarea.value;
      fix_config();
      force_inspect_all_messages(); };

  // Bann button
  const bannbutton = document.querySelectorAll('.ytlw-bann-button')
    .forEach(elm => {
       elm.ondragover = e => { e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = 'copy'; };
       elm.ondrop = e => {
          const xs = e.dataTransfer.getData('text/uri-list').match(photouri_regexp);
          if (!xs) { return; }

          e.stopPropagation();
          e.preventDefault();
          const k = e.dataTransfer.getData('text/plain') + '/' + xs[1] + '/' + xs[2];
          const typ = elm.getAttribute('ytlw-bann-type') || 'ERROR';
          if (typ === 'NUTRAL') {
            delete config.inspected_accounts[k];
          } else if (typ === 'BANN' || typ == 'SAFE') {
            config.inspected_accounts[k] = typ;
          } else { return ; }

          // Save bann list.
          GM_setValue('YTLW_BANN_ACCOUNTS',
          Object.keys(config.inspected_accounts).filter(x => {
              return config.inspected_accounts[x] === 'BANN'; }).join("\n") );

          force_inspect_all_messages(); // Update view
        };
    });
})();

