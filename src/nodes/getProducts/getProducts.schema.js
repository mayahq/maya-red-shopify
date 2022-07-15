const { Node, Schema, fields } = require("@mayahq/module-sdk");
const ShopifyAuth = require("../shopifyAuth/shopifyAuth.schema.js");
const axios = require("axios");
const {color} = require("../../constants.js");
class GetProducts extends Node {
    constructor(node, RED, opts) {
        super(node, RED, {
            ...opts,
            // masterKey: 'You can set this property to make the node fall back to this key if Maya does not provide one'
        });
    }

    static schema = new Schema({
        name: "get-products",
        label: "Products",
        category: "Shopify",
        isConfig: false,
        color:color,
        fields: {
            // Whatever custom fields the node needs.
            ShopifyAuth: new fields.ConfigNode({ type: ShopifyAuth }),
            action: new fields.SelectFieldSet({
                fieldSets: {
                    getAllProducts: {},
                    deleteProduct: {
                        productIdtoDelete: new fields.Typed({
                            type: "str",
                            label: "Product ID",
                            allowedTypes: ["msg", "str"],
                        }),
                    },
                    getById: {
                        productId: new fields.Typed({
                            type: "str",
                            label: "Product ID",
                            allowedTypes: ["msg", "str"],
                        }),
                    },
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

        let successStatus = "";
        const request = {
            method: "GET",
            url: "https://" + storeUrl + "/admin/api/2022-07/products.json",
            headers: {
                "Content-Type": "application/json",
                "X-Shopify-Access-Token": ShopifyAuth.accessToken,
            },
        };

        if (vals.action.selected === "getAllProducts") {
            this.setStatus('PROGRESS', 'Getting all products...');
            request.url = "https://" + storeUrl + "/admin/api/2022-07/products.json";
            successStatus = 'Products retrieved successfully'
        }
        else if (vals.action.selected === "deleteProduct") {
            this.setStatus('PROGRESS', 'Deleting product...');
            request.method = "DELETE";
            request.url = "https://" + storeUrl + "/admin/api/2022-07/products/" + vals.action.childValues.productIdtoDelete + ".json";
            successStatus = 'Product deleted successfully'
        }
        else if (vals.action.selected === "getById") {
            this.setStatus('PROGRESS', 'Getting product...');
            request.url = "https://" + storeUrl + "/admin/api/2022-07/products/" + vals.action.childValues.productId + ".json";
            successStatus = 'Product retrieved successfully'
        }

        try {
            const productResponse = await axios(request);
            msg.products = await productResponse.data;
            this.setStatus("SUCCESS", successStatus);
        } catch (err) {
            msg.__isError = true;
            msg.__error = err;

            this.setStatus("ERROR", err.message);
        }
        return msg;
    }
}

module.exports = GetProducts;
