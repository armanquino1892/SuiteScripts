/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/log', 'N/record', 'N/search'],
/**
* @param{log} log
* @param{record} record
*/
(log, record, search) => {

  var CONST_ITEMTYPE = {
		'Assembly' : 'assemblyitem',
		'Description' : 'descriptionitem',
		'Discount' : 'discountitem',
		'GiftCert' : 'giftcertificateitem',
		'InvtPart' : 'inventoryitem',
		'Group' : 'itemgroup',
		'Kit' : 'kititem',
		'Markup' : 'markupitem',
		'NonInvtPart' : 'noninventoryitem',
		'OthCharge' : 'otherchargeitem',
		'Payment' : 'paymentitem',
		'Service' : 'serviceitem',
		'Subtotal' : 'subtotalitem'
	};

    /**
     * Defines the Suitelet script trigger point.
     * @param {Object} scriptContext
     * @param {ServerRequest} scriptContext.request - Incoming request
     * @param {ServerResponse} scriptContext.response - Suitelet response
     * @since 2015.2
     */
    const onRequest = (scriptContext) => {
        try {
          var ifID = scriptContext.request.parameters.ifid;
          var isChain = scriptContext.request.parameters.ischain;
          
          var ifRec = record.load({
            id: ifID,
            type: record.Type.ITEM_FULFILLMENT
          });
          
          var soID = ifRec.getValue({
              fieldId: 'createdfrom'
          });

          var soRec = record.load({
            id: soID,
            type: record.Type.SALES_ORDER
          });

          var htmlTable = '<table class="itemtable" style="width: 100%; margin-top: 10px;">' +
          '<thead>' +
              '<tr>';
              if(isChain == "Yes"){
                htmlTable += '<th align="right" colspan="6">Customer Part No.</th>' +
                    '<th colspan="12">Item</th>' +
                    '<th align="right" colspan="4">Case QTY</th>' +
                    '<th align="right" colspan="4">Ordered</th>' +
                    '<th align="right" colspan="6">Back Ordered</th>' +
                    '<th align="right" colspan="6">Cartons</th>';
              } else {
                htmlTable += '<th colspan="12">Item</th>' +
                    '<th align="right" colspan="3">Customer Part No.</th>' +
                    '<th align="right" colspan="4">Ordered</th>' +
                    '<th align="right" colspan="4">BackOrdered</th>' +
                    '<th align="right" colspan="4">Shipped</th>' +
                    '<th align="right" colspan="4">Price</th>';
              }
                  
        htmlTable += '</tr>' +
          '</thead>';


          var totalPrice = 0;
            var itemCount = ifRec.getLineCount('item');
            for(var i = 0; i < itemCount; i++) {
              
                var itemId = ifRec.getSublistValue({
                    line: i,
                    fieldId: 'item',
                    sublistId: 'item'
                });

                var itemType = ifRec.getSublistValue({
                  sublistId: 'item',
                  fieldId: 'itemtype',
                  line: i
              })
              log.debug('Item Type', itemType);
              log.debug('Item Type Enum Val', CONST_ITEMTYPE[itemType])

              var ifItemOrdered = ifRec.getSublistValue({
                sublistId: 'item',
                fieldId: 'quantity',
                line: i
              })
              log.debug('Item Ordered', ifItemOrdered)

              var caseQTYVal = search.lookupFields({
                type: CONST_ITEMTYPE[itemType],
                id: itemId,
                columns: 'custitemcp_qty'
            });
            var caseQTY = Object.keys(caseQTYVal).length > 0 ? caseQTYVal.custitemcp_qty : 0;
              log.debug('Case QTY', caseQTYVal)
 

            var calcVal = ifItemOrdered / caseQTY
            var numCartonShipped =  ifItemOrdered > 0 && caseQTY > 0 ? parseFloat(calcVal).toFixed(2) : 0
         
            var lineNumber = soRec.findSublistLineWithValue({
              sublistId: 'item',
              fieldId: 'item',
              value: itemId
          });
              
              var soItem = soRec.getSublistText({
                sublistId: 'item',
                fieldId: 'item',
                line: lineNumber
            });
            var soItemDesc = soRec.getSublistText({
                sublistId: 'item',
                fieldId: 'description',
                line: lineNumber
            })
              
              var soItemBackOrdered = soRec.getSublistValue({
                sublistId: 'item',
                fieldId: 'quantitybackordered',
                line: lineNumber
              })

              var soItemQTY = soRec.getSublistValue({
                sublistId: 'item',
                fieldId: 'quantity',
                line: lineNumber
              })
              
              var soItemPrice = soRec.getSublistValue({
                sublistId: 'item',
                fieldId: 'amount',
                line: lineNumber
              })
              totalPrice = totalPrice + parseFloat(soItemPrice)// Total Item
              var soCustPartNo = soRec.getSublistText({
                sublistId: 'item',
                fieldId: 'custcol_scm_customerpartnumber',
                line: lineNumber
              })
              
              htmlTable += '<tr>';
              if(isChain == "Yes"){
                htmlTable += '<td colspan="6">'+ soCustPartNo +'</td>'; // Customer Part #
                htmlTable += '<td colspan="12"><span class="itemname">'+ soItem.replaceAll(/&/g, "&amp;").replaceAll(/</g, "&lt;").replaceAll(/>/g, "&gt;") +'</span><br />'+ soItemDesc.replaceAll(/&/g, "&amp;").replaceAll(/</g, "&lt;").replaceAll(/>/g, "&gt;") +'</td>'; //Item
                htmlTable += '<td align="right" colspan="4">'+ caseQTY +'</td>'; // Case QTY
                htmlTable += '<td align="right" colspan="4">'+ ifItemOrdered +'</td>'; // Ordered
                htmlTable += '<td align="right" colspan="6">'+ soItemBackOrdered +'</td>'; // BackOrdered
                htmlTable += '<td align="right" colspan="6">'+ numCartonShipped +'</td>' // # Of Carton Shipped
              } else {
                htmlTable += '<td colspan="12"><span class="itemname">'+ soItem.replaceAll(/&/g, "&amp;").replaceAll(/</g, "&lt;").replaceAll(/>/g, "&gt;") +'</span><br />'+ soItemDesc.replaceAll(/&/g, "&amp;").replaceAll(/</g, "&lt;").replaceAll(/>/g, "&gt;") +'</td>'; //Item
                htmlTable += '<td colspan="3">'+ soCustPartNo +'</td>'; //Customer Part #
                htmlTable += '<td align="right" colspan="4">'+ ifItemOrdered +'</td>'; // Ordered
                htmlTable += '<td align="right" colspan="4">'+ soItemBackOrdered +'</td>'; // BackOrdered
                htmlTable += '<td align="right" colspan="4">'+ soItemQTY +'</td>'; // Shipped
                htmlTable += '<td align="right" colspan="4">$'+ soItemPrice +'</td>'; // Price
              }
              htmlTable += '</tr>';
            }
            htmlTable += '</table>';
            scriptContext.response.write(htmlTable);
         
        } catch (err) {
            log.debug("Error", err.message);
        }
    }

    return {onRequest}

});
