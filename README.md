
![Screenshot](https://raw.github.com/dolphyn/dolphyn/master/docs/design/simple_mail.png "Screenshot")

Dolphyn Mail: The Beautiful WebMail
===================================

Dolphyn mail is a webmail that connects to existing IMAP/SMTP servers. The medium term goal is to also embed IMAP and
SMTP servers.

Right now, it only allows to read emails and send new ones. The major functionality missing are:

- answer emails
- contact management (for send auto complete)

It is not usable yet. ** Dolphyn Mail ** is still in progress.

Security: What dolphyn mail is and isn't
----------------------------------------

- Dolphyn mail helps you to host your own webmail.
- It does encrypt 'some' sensitive information in the DB (IMAP and SMTP login and password).
- It does not store your emails (your IMAP server does that).
- It is not a secure communication platform.
- It does not embed DNS, SMTP or an IMAP server yet. For these, you still need Bind9, Postfix and Dovecot.

Quick Start
===========

```
  [Install node.js](http://nodejs.org/download/)
  git clone https://github.com/dolphyn/dolphyn.git
  cd dolphyn
  make install
  make start
```

Task list
=========

- [ ] extract DateHumanize from the 'controllers.js' file #refactor
- [x] show date when showing message
- [ ] separate controllers in multiple files. lazy load them. #refactor
- [ ] when retrieving mail from backend, merge instead of replacing #bug
- [ ] ability to mark mail as unread (vertical bar clickable) #feature
- [ ] ability to configure boxes #feature
- [ ] UX enhance mail subject's readability #feature
- [ ] have the ability to configure pagination (as end user) #feature
- [ ] add ability to choose the inbox behaviour: 'unread first' vs 'by date' (not sure I really want to give this ability) #feature
- [ ] add 'about' link with page to contributors & licenses #feature
- [ ] flag mail as read should uncount the displayed unread email count #bug
- [ ] fix unwanted vertical scrollbar in the email body window :/ #bug
- [ ] implement long lived sessions #feature
- [ ] ability to cancel account creation on the on-boarding screen #feature
- [ ] auto delete created account but not configured in 1 hour (lazily, don't cron it) #feature
- [ ] lost password capability #feature #sec
- [ ] in-page login feedback on failure (password & email) #feature
- [ ] ability to compose mail #feature
- [ ] new mail notif + auto load #feature
- [ ] ability to answer & answer all #feature
- [ ] quick reply box #feature
- [ ] ability to forward mail #feature
- [ ] manage attachments #feature
- [ ] settings feedback (dynamic UI, display errors) #feature
- [ ] display connection errors #feature
- [ ] implement conversations #feature
- [ ] attachment search capability #feature
- [x] add support for 'Sent' 'Drafts' and 'Trash' mailboxes
- [x] remove the hack made to prevent loading the BoxCtrl twice on login
- [x] bug: current left menu not being shown as selected
- [x] have the settings page have the same left menu as inboxes
- [x] push new mail to the UI
- [x] refactor the front-end to get rid of the HTTP APIs
- [x] retrieve all unread mails on login
- [x] mail read flag on read mail
- [x] automated configuration for hash iterations during install wizard (nice)
- [x] application setup wizard
- [ ] the on-boarding is probably broken since the deletion of the HTTP endpoints and needs fixing. #bug
- [~] support the yubikey #feature #sec
- [x] encrypt imap & smtp credentials #sec #feature
- [ ] use [Primus](https://github.com/primus/primus) instead of socket.io #refactor
- [ ] imap disconnects after a while and do not automatically reconnects #bug
- [ ] log account activity #sec #feature
- [ ] update encryption when password changes #bug #sec
- [ ] encryption should be based on multi factor authentication when it is activated #sec #bug
- [ ] support google like TOTP #sec feature
- [ ] support SMS 2 factor auth #sec feature
- [x] unread count display is broken
- [x] on new mail, the order gets screwed up
- [ ] use markdown for sending emails and send them in both plain text and html
- [ ] smart attachement reminder

The Vision
==========

The vision is not just a webmail. It's enhancing the current mail system little by little to make it pleasantly secure.
Dolphy Mail's goal is multifold:

### Own your mails

It should be easy to own your mails. However, installing your own SMTP and IMAP servers is currently a huge hassle. It
should not be. Dolphyn Mail will solve that.

The state of the art is even worse when it comes to encrypting stored emails.

### Make GPG easy

Make mails content a minimum secure out of the box with no configuration (The GPG user experience sucks) would be a big win for
privacy.

### Replace SMTP

SMTP is inherently insecure, even with GPG metadata is not secure.

Make mails metadata secure, ie. preventing a third party from knowing who exchanges mails. There are technologies that
allow anonymous networking where a single node does not know who sent the packet or who it is for.

### Be open

It is sad that ** Lavabit ** shut down. It would have continued on though if it were open source.

Internet is made to be decentralized and your secure mail should be a service that you own. You can also use a web
service if you wish.

Open source has shown it is possible to free your work and still have efficient business models.

I would like to head towards such vision in 3 stages:

Stage 1: A beautiful webmail
----------------------------

The current open source webmails don't look as sexy as free commercial ones (roundcube vs gmail).
The first step is to create a webmail that contains no fuss and focuses on delivering a great mail experience.

Dolphyn Mail is currently in this development stage.

Stage 2: Owning you mail, securely
----------------------------------

This stage's goal is to make mails more secure by protecting the content of most mails and encrypting their storage:

- easy to install application with upgrading capability (for fixing vulnerabilities)
- unix based
- embedded SMTP server with automated DNS setup
- embed GPG
- encrypt stored email

Stage 3: Make mail inherently secure
------------------------------------

All these steps taken towards privacy are not sufficient for the truly paranoid. How to ensure you are communicating
with the right person ? How to protect who you are communicating with ? Prevent eavesdropping ?

The last stage consists in protecting the metadata linked to each mail and to establish a network of trust. This needs a
virtual network of nodes (yes, like Tor or [i2p](http://www.i2p2.de/)) and other crazy stuff.

I personally don't need this so I'm not sure I'll ever implement it but what's a life with no dreams ?

License(s)
==========

Dolphyn Mail mail is governed by 3 licenses. It is very important for me to keep Dolphyn Mail mail an open source,
business friendly application. Having said that should not stop you from reading the licenses:

The [Source Code License (MIT)](https://github.com/dolphyn/dolphyn/blob/master/LICENSE.md) covers the source
code, the [Design License (CC Attribution 3.0)](https://github.com/dolphyn/dolphyn/blob/master/docs/design/LICENSE_SIMPLE_MAIL.md)
covers the UI and the [Font License (SIL OPEN FONT LICENSE)](https://github.com/dolphyn/dolphyn/blob/master/public/css/fonts/Quicksand/LICENSE.md)
covers the Quicksand font that the webmail uses.
