const { Node, Schema, fields } = require("@mayahq/module-sdk");
const ShopifyAuth = require("../shopifyAuth/shopifyAuth.schema.js");
const axios = require("axios");
const { color } = require("../../constants.js");

class Payments extends Node {
    constructor(node, RED, opts) {
        super(node, RED, {
            ...opts,
            // masterKey: 'You can set this property to make the node fall back to this key if Maya does not provide one'
        });
    }

    static schema = new Schema({
        name: "payments",
        label: "Payments",
        category: "Shopify",
        isConfig: false,
        color: color,
        fields: {
            // Whatever custom fields the node needs.
            ShopifyAuth: new fields.ConfigNode({ type: ShopifyAuth }),
            action: new fields.SelectFieldSet({
                fieldSets: {
                    getAllBalance: {},
                    getAllDisputes: {},
                    getAllPayouts: {},
                    getAllTransactions: {},
                },
            }),
        },
    });

    onInit() {
        // Do something on initialization of node
    }

    async onMessage(msg, vals) {
        // Handle the message. The returned value will
        // be sent as the message to any further nodes.
        const { ShopifyAuth } = this.credentials; // credentials are set in the node's config
        const storeUrl = vals.ShopifyAuth.shopUrl; //shopUrl field is set in the node's config

        const request = {
            method: "GET",
            url: "https://" + storeUrl + "/admin/api/2022-07/payments.json",
            headers: {
                "Content-Type": "application/json",
                "X-Shopify-Access-Token": ShopifyAuth.accessToken,
            },
        };
        let successStatus = "";
        if (vals.action.selected === "getAllBalance") {
            this.setStatus('PROGRESS', 'Getting balance...');
            request.url =
                "https://" +
                storeUrl +
                "/admin/api/2022-07/shopify_payments/balance.json";
            successStatus = "Balance retrieved successfully";
        } else if (vals.action.selected === "getAllDisputes") {
            this.setStatus('PROGRESS', 'Getting disputes...');
            request.url =
                "https://" +
                storeUrl +
                "/admin/api/2022-07/shopify_payments/disputes.json";
            successStatus = "Disputes retrieved successfully";
        } else if (vals.action.selected === "getAllPayouts") {
            this.setStatus('PROGRESS', 'Getting payouts...');
            request.url =
                "https://" +
                storeUrl +
                "/admin/api/2022-07/shopify_payments/payouts.json";
            successStatus = "Payouts retrieved successfully";
        } else if (vals.action.selected === "getAllTransactions") {
            this.setStatus('PROGRESS', 'Getting transactions...');
            request.url =
                "https://" +
                storeUrl +
                "/admin/api/2022-07/shopify_payments/balance/transactions.json";
            successStatus = "Transactions retrieved successfully";
        }
        try{
            const response = await axios(request);
            msg.payments = await response.data;
            this.setStatus("SUCCESS", successStatus);
        }
        catch(err){
            msg.__isError = true;
            msg.__error = err;
            this.setStatus("ERROR", err.message);
        }
        return msg;
    }
}

module.exports = Payments;
