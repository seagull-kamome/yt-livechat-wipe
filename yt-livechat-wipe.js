// ==UserScript==
// @name        Wipe junk chats out from Youtube Livechat
// @namespace   YoutubeLivechatWipeSpam
// @description Wipe junk messages out.
// @author      HATTORI, Hiroki
// @match       https://www.youtube.com/live_chat*
// @version     1.0.1
// @require     https://cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/js/toastr.min.js
// @resource    toastrCSS https://cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/css/toastr.min.css
// @grant       GM_addStyle
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_getResourceText
// ==/UserScript==
(function () {
  /* ********************************************************************** */
  // Manupukate configuration.
  let config = {
      bann_words: GM_getValue('YTLW_BANN_WORDS') || '',
      bann_words_regexp: null
    };
  const fix_config = function() {
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
yt-live-chat-text-message-renderer[author-type=''] { display: none!important; }
.ytlw-member-hidden yt-live-chat-item-list-renderer
yt-live-chat-text-message-renderer[author-type='member'] { display: none!important; }
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

.ytlw-bann-words { display: none!important; }
`);


  /* ********************************************************************** */
  // Message inspector
  const chatmessage_inspector = async function(x) {
      x.classList.remove('ytlw-bann-words');

      // Extract message text and author information.
      const author_name = x.querySelector('#author-name').innerText;
      const author_id = (function(y) { return y[3] + y[6]; })(
        x.querySelector('#author-photo > img').getAttribute('src').split('/') );
      const post_time = x.querySelector('#timestamp').innerText;
      const message = x.querySelector('#message').innerText;

        // And check it
        if (!!config.bann_words_regexp && config.bann_words != ''
         && (config.bann_words_regexp.test(author_name) || config.bann_words_regexp.test(message)) ) {
          x.classList.add('ytlw-bann-words');
        }
    };
  const force_inspect_all_messages = function() {
      document.querySelectorAll('yt-live-chat-text-message-renderer, yt-live-chat-paid-message-renderer')
        .forEach(chatmessage_inspector);
    };
  force_inspect_all_messages();

  (new MutationObserver(function (xs) {
    xs.forEach(function (x) {
        x.addedNodes.forEach(function(y) {
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
<div class='ytlw-settings'>
  <div class='ytlw-panel' id='ytlw-setting-panel'>
    <div class='ytlw-panel_box'>
      <div>
        <span>Hide by member type:</spam>
      </div>
      <div id='ytlw-popup-hide-by-member-type'>
        <input type='checkbox' name='guest' checked='checked' />Guest
        <input type='checkbox' name='member' checked='checked' />Member
        <input type='checkbox' name='moderator' checked='checked' />Moderator
        <input type='checkbox' name='owner' checked='checked' />Owner <br />
        <input type='checkbox' name='superchat' checked='checked' />Super Chat
        <input type='checkbox' name='supersticker' checked='checked' />Super Sticker
        <input type='checkbox' name='membership' checked='checked' />Membership
      </div>
      <div>
        <span>Bann words: (regexp)</span>
      </div>
      <div>
        <textarea id='ytlw-popup-bannwords' rows='4' style='resize:holizontal; width:100%;'></textarea>
      </div>
      <div>
        <button id='ytlw-popup-apply'>Apply</button>
      </div>
    </div>
  </div>
</div>
<button type='button' name='panelbutton' value='panelbutton' class='ytlw-button'
    id='ytlw-setting-button'
    style="background: rgba(0,0,0,0);margin-left: 10px;white-space: nowrap;">
  <span>[Filter]</span>
</button>`

  const refbtn = document.querySelector(
    '#chat-messages > yt-live-chat-header-renderer > yt-icon-button');
  if (!refbtn) { return ; }
  refbtn.insertAdjacentHTML('beforebegin', popuphtml);

  const popup = document.getElementById('ytlw-setting-panel');
  const bann_word_textarea = popup.querySelector('#ytlw-popup-bannwords');
  document.getElementById('ytlw-setting-button').onclick = function() {
      // when popup button pressed, popup the panel.
      bann_word_textarea.value = config.bann_words;
      popup.style.visibility = (popup.style.visibility == 'visible')? 'hidden' : 'visible';
    };

  // Setting actions.
  document.querySelectorAll("#ytlw-popup-hide-by-member-type input[type='checkbox']")
    .forEach(function(x) {
        // when member type filter changed.
        const c = 'ytlw-' + x.name + '-hidden';
        x.onchange = function () {
            if (x.checked) {
              document.body.classList.remove(c);
            } else {
              document.body.classList.add(c);
            } }; });
  document.getElementById('ytlw-popup-apply').onclick = function(x) {
      // when "Apply" pressed.
      config.bann_words = bann_word_textarea.value;
      fix_config();
      force_inspect_all_messages(); };

})();

