# ⚠️ DEPRECATED⚠️ 

## pafilo

[![Build](https://travis-ci.org/bandwidthcom/pafilo.png)](https://travis-ci.org/bandwidthcom/pafilo)
[![Dependencies](https://david-dm.org/bandwidthcom/pafilo.png)](https://david-dm.org/bandwidthcom/pafilo)

MailGun mailing provider for service_maker

## Install

```
npm install pafilo
```
and then use this plugin from code like

```
yield server.register(require("pafilo"));
```

or from  manifest file

```
"plugins":{
   "pafilo": {}
}
```

Also you can use yeoman generator to install this plugin

```
yo co-hapi:add-plugin pafilo
```

## Parameters

Credentials: apiKey*.

Options with star (*) are required.

## Example

```
 $ sm_cli service-create mail:pafilo -c apiKey=key
```
