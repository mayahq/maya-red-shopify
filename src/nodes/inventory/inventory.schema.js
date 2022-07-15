const {
    Node,
    Schema,fields
} = require('@mayahq/module-sdk')
const shopifyAuth = require('../shopifyAuth/shopifyAuth.schema.js');
const axios = require('axios');
const { color } = require('../../constants.js');
class Inventory extends Node {
    constructor(node, RED, opts) {
        super(node, RED, {
            ...opts,
            // masterKey: 'You can set this property to make the node fall back to this key if Maya does not provide one'
        })
    }

    static schema = new Schema({
        name: 'inventory',
        label: 'Inventory',
        category: 'Shopify',
        isConfig: false,
        color,
        fields: {
            // Whatever custom fields the node needs.
            ShopifyAuth: new fields.ConfigNode({ type: shopifyAuth }),
            inventoryItemId: new fields.Typed({type:"str", allowedTypes:["msg", "str"]}),
        },

    })

    onInit() {
        // Do something on initialization of node
    }

    async onMessage(msg, vals) {
        // Handle the message. The returned value will
        // be sent as the message to any further nodes.
        this.setStatus("PROGRESS", "Fetching inventory...");

        const {ShopifyAuth} = this.credentials; // credentials are set in the node's config
        const storeUrl = vals.ShopifyAuth.shopUrl; //shopUrl field is set in the node's config

        const request = {
            method: "GET",
            url: "https://" + storeUrl + "/admin/api/2022-07/inventory_items.json?ids=" + vals.productId,
            headers: {
                "Content-Type": "application/json",
                "X-Shopify-Access-Token": ShopifyAuth.accessToken,
            }
        }
        try{
            const inventoryResponse = await axios(request);
            msg.inventory = await inventoryResponse.data;
            this.setStatus("SUCCESS", "Inventory fetched successfully");
        }
        catch(err){
            msg.__isError = true;
            msg.__error = err;
            this.setStatus("ERROR", err.message);
        }
        return msg;

    }
}

module.exports = Inventory