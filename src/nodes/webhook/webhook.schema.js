const { Node, Schema, fields } = require("@mayahq/module-sdk");
let http = require("http");
const cors = require('cors');
const crypto = require('crypto');
const getRawBody = require('raw-body')
const ShopifyAuth = require("../shopifyAuth/shopifyAuth.schema.js");
const axios = require("axios");
const { color } = require("../../constants.js");
/*
action: new fields.SelectFieldSet({
        fieldSets: {
          createWebhook: {
            Cart: new fields.SelectFieldSet({
              fieldSets: {
                cartsCreate: {},
                cartsUpdate: {},
              },
            }),
            Checkout: new fields.SelectFieldSet({
              fieldSets: {
                checkoutsCreate: {},
                checkoutsUpdate: {},
              },
            }),
            Customer: new fields.SelectFieldSet({
              fieldSets: {
                customersCreate: {},
                customersEnable: {},
                customersDisable: {},
                customersUpdate: {},
              },
            }),
            Fullfilment: new fields.SelectFieldSet({
              fieldSets: {
                fullfilmentsCreate: {},
                fullfilmentsUpdate: {},
              },
            }),
            Order: new fields.SelectFieldSet({
              fieldSets: {
                ordersCreate: {},
                ordersUpdated: {},
                ordersCancelled: {},
                ordersFulfilled: {},
                ordersPaid:{},
              },
            }),
            Product: new fields.SelectFieldSet({
              fieldSets: {
                productsCreate: {},
                productsUpdate: {},
              },
            }),
          },
          getWebhooks: {},
        },
      }),
*/
class Webhook extends Node {
  constructor(node, RED, opts) {
    super(node, RED, {
      ...opts,
      // masterKey: 'You can set this property to make the node fall back to this key if Maya does not provide one'
    });

  }

  static schema = new Schema({
    name: "webhook",
    label: "Webhook",
    category: "Shopify",
    isConfig: false,
    color,
    io: {
      inputs: 0,
      outputs: 1
    },
    fields: {
      // Whatever custom fields the node needs.
      ShopifyAuth: new fields.ConfigNode({ type: ShopifyAuth }),
      webhookId: new fields.Typed({ type: "str", allowedTypes: ["str"], displayName: "Webhook Suffix" }),
    }
  });
  

  handler = async (req, res) => {
    const isVerified = true;
    
    const msgid = this.RED.util.generateId();
    res._msgid = msgid;
    if (isVerified) {
      this.redNode.send({
        _msgid: msgid,
        webhookEvent: req.headers['x-shopify-topic'],
        payload: req.body,
      }, false)
    }
    else {
      this.redNode.send({
        _msgid: msgid,
        __isError: true,
        __error: new Error('Webhook is not recieved'),
      }, false)
    }
    res.write('Webhook recieved!'); //write a response else shopify will keep sending webhooks
    res.end();
  }
  onInit() {
    // Do something on initialization of node
    const RED = this.RED;

    let corsHandler = function (req, res, next) {
      next();
    };

    if (RED.settings.httpNodeCors) {
      corsHandler = cors(RED.settings.httpNodeCors);
      RED.httpNode.options("*", corsHandler);
    }
    const hookUrl = "/" + (this.redNode.webhookId ? this.redNode.webhookId : "");
    RED.httpNode.post(hookUrl, corsHandler, this.handler);

  }

  async onMessage(msg, vals) {
    // Handle the message. The returned value will
    // be sent as the message to any further nodes.
  }
}

module.exports = Webhook;
