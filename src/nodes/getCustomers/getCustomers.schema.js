const {
    Node,
    Schema,
    fields
} = require('@mayahq/module-sdk')
const ShopifyAuth = require('../shopifyAuth/shopifyAuth.schema.js')
const axios = require('axios')
const { color } = require('../../constants.js')
class GetCustomers extends Node {
    constructor(node, RED, opts) {
        super(node, RED, {
            ...opts,
            // masterKey: 'You can set this property to make the node fall back to this key if Maya does not provide one'
        })
    }

    static schema = new Schema({
        name: 'get-customers',
        label: 'Customers',
        category: 'Shopify',
        isConfig: false,
        color,
        fields: {
            // Whatever custom fields the node needs.
            ShopifyAuth: new fields.ConfigNode({ type: ShopifyAuth }),
            action: new fields.SelectFieldSet({
                fieldSets: {
                    getAllCustomers: {},
                    getById: {
                        customerId: new fields.Typed({
                            type: 'str',
                            label: 'Customer ID',
                            allowedTypes: ['msg', 'str'],
                        }),
                    },
                    getOrdersByCustomerId: {
                        customerIdforOrders: new fields.Typed({
                            type: 'str',
                            label: 'Customer ID',
                            allowedTypes: ['msg', 'str'],
                        }),
                    }
                }

            }),

        }
    })

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
            url: "https://" + storeUrl + "/admin/api/2022-07/customers.json",
            headers: {
                "Content-Type": "application/json",
                "X-Shopify-Access-Token": ShopifyAuth.accessToken,
            }
        }
        let successStatus = "";
        if (vals.action.selected === "getAllCustomers") {
            this.setStatus('PROGRESS', 'Retrieving customers...')
            request.url = "https://" + storeUrl + "/admin/api/2022-07/customers.json";
            successStatus = "Customers retrieved successfully";
        } 
        else if (vals.action.selected === "getById") {
            this.setStatus('PROGRESS', 'Retrieving customer...')
            request.url = "https://" + storeUrl + "/admin/api/2022-07/customers/" + vals.action.childValues.customerId + ".json";
            successStatus = "Customer retrieved successfully";
        }
        else if (vals.action.selected === "getOrdersByCustomerId") {
            this.setStatus('PROGRESS', 'Retrieving orders...')
            request.url = "https://" + storeUrl + "/admin/api/2022-07/customers/" + vals.action.childValues.customerIdforOrders + "/orders.json";
            successStatus = "Orders retrieved successfully";
        }

        try {
            const customerResponse = await axios(request);
            msg.customers = await customerResponse.data;
            this.setStatus('SUCCESS', successStatus)
        } catch (err) {
            msg.__isError = true;
            msg.__error = err;
            this.setStatus('ERROR', err.message);
        }
        return msg;

    }
}

module.exports = GetCustomers