const { Node, Schema, fields } = require("@mayahq/module-sdk");
const ShopifyAuth = require("../shopifyAuth/shopifyAuth.schema.js");

const axios = require("axios");
const { color } = require("../../constants.js");

class GetOrders extends Node {
  constructor(node, RED, opts) {
    super(node, RED, {
      ...opts,
      // masterKey: 'You can set this property to make the node fall back to this key if Maya does not provide one'
    });
  }

  static schema = new Schema({
    name: "get-orders",
    label: "Orders",
    category: "Shopify",
    isConfig: false,
    color,
    fields: {
      // Whatever custom fields the node needs.
      ShopifyAuth: new fields.ConfigNode({ type: ShopifyAuth }),
      action: new fields.SelectFieldSet({
        fieldSets: {
          getAllOrders: {},
          getAbandonedCheckouts:{},
          getById: {
            orderId: new fields.Typed({
              type: "str",
              label: "Order ID",
              allowedTypes: ["msg", "str"],
            }),
          },
          deleteOrder:{
            orderIdToDelete: new fields.Typed({
              type: "str",
              label: "Order ID",
              allowedTypes: ["msg", "str"],
            }),
          },
          getFulfillment: {
            orderIdForFulfillment: new fields.Typed({
              type: "str",
              label: "Order ID",
              allowedTypes: ["msg", "str"],
            }),
          }
        },
      })
    }

  });

  onInit() {
    // Do something on initialization of node
  }

  async onMessage(msg, vals) {
    // Handle the message. The returned value will
    // be sent as the message to any further nodes.

    const { ShopifyAuth } = this.credentials; // credentials are set in the node's config
    // msg.credentials = this.credentials;
    // msg.vals = vals;
    const storeUrl = vals.ShopifyAuth.shopUrl; //shopUrl field is set in the node's config
    // console.log(storeUrl);
    // console.log(ShopifyAuth.accessToken);
    let successStatus = "";
    const request = {
      method: "GET",
      url: "https://" + storeUrl + "/admin/api/2022-07/orders.json?status=any",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": ShopifyAuth.accessToken,
      }
    }

    if (vals.action.selected === "getAllOrders") {
      this.setStatus('PROGRESS', 'Getting all orders...');
      request.url = "https://" + storeUrl + "/admin/api/2022-07/orders.json?status=any";
      successStatus = 'Orders retrieved successfully'
    }
    else if (vals.action.selected === "getAbandonedCheckouts") {
      this.setStatus('PROGRESS', 'Getting abandoned checkouts...');
      request.url = "https://" + storeUrl + "/admin/api/2022-07/checkouts.json";
      successStatus = 'Abandoned checkouts retrieved successfully'
    }
    else if (vals.action.selected === "getById") {
      this.setStatus('PROGRESS', 'Getting order by id...');
      request.url = "https://" + storeUrl + "/admin/api/2022-07/orders/" + vals.action.childValues.orderId + ".json";
      successStatus = 'Order retrieved successfully'
    }
    else if (vals.action.selected === "deleteOrder") {
      this.setStatus('PROGRESS', 'Deleting order...');
      request.url = "https://" + storeUrl + "/admin/api/2022-07/orders/" + vals.action.childValues.orderIdToDelete+ ".json";
      request.method = "DELETE";
      successStatus = 'Order deleted successfully'
    }
    else if (vals.action.selected === "getFulfillment") {
      this.setStatus('PROGRESS', 'Getting fulfillment...');
      request.url = "https://" + storeUrl + "/admin/api/2022-07/orders/" + vals.action.childValues.orderIdForFulfillment + "/fulfillments.json";
      successStatus = 'Fulfillment retrieved successfully'
    }

    try {
      const orderResponse = await axios(request);
      msg.orders = await orderResponse.data;
      this.setStatus("SUCCESS", successStatus);
    } catch (err) {
      msg.__isError = true;
      msg.__error = err;

      this.setStatus("ERROR", err.message);
    }
    return msg;
  }
}

module.exports = GetOrders;
