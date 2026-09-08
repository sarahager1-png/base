import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@2.5.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { purchaseId } = await req.json();
    
    const purchase = await base44.asServiceRole.entities.PurchaseRequest.get(purchaseId);
    
    if (!purchase) {
      return Response.json({ error: 'Purchase not found' }, { status: 404 });
    }

    const doc = new jsPDF();

    // Header
    doc.setFontSize(22);
    doc.text('BINA MANAGERIAL', 105, 20, { align: 'center' });
    
    doc.setFontSize(16);
    doc.text('Purchase Approval Certificate', 105, 30, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Approval #: ${purchase.id.slice(0, 8).toUpperCase()}`, 105, 40, { align: 'center' });
    
    // Date
    const approvalDate = purchase.approval_date || new Date().toISOString().split('T')[0];
    doc.text(`Date: ${new Date(approvalDate).toLocaleDateString('en-GB')}`, 20, 55);
    
    // Separator
    doc.setLineWidth(0.5);
    doc.line(20, 60, 190, 60);
    
    // Purchase Details
    doc.setFontSize(12);
    doc.text('Purchase Details:', 20, 70);
    
    doc.setFontSize(10);
    doc.text(`Requester: ${purchase.user_name}`, 20, 80);
    doc.text(`Item: ${purchase.item_name}`, 20, 88);
    doc.text(`Reason: ${purchase.reason}`, 20, 96);
    
    if (purchase.estimated_cost) {
      doc.text(`Estimated Cost: ${purchase.estimated_cost} ILS`, 20, 104);
    }
    
    doc.text(`Urgency: ${purchase.urgency === 'urgent' ? 'URGENT' : 'Normal'}`, 20, 112);
    
    // Approval section
    doc.setLineWidth(0.5);
    doc.line(20, 120, 190, 120);
    
    doc.setFontSize(12);
    doc.text('Approval:', 20, 130);
    
    doc.setFontSize(10);
    doc.text(`Approved by: ${purchase.approved_by || user.full_name}`, 20, 140);
    doc.text(`Status: APPROVED`, 20, 148);
    
    // Footer
    doc.setFontSize(8);
    doc.text('This document serves as official approval for the purchase request.', 105, 270, { align: 'center' });
    doc.text('Please present this document when making the purchase.', 105, 276, { align: 'center' });
    
    const pdfBytes = doc.output('arraybuffer');

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=purchase-approval-${purchase.id.slice(0, 8)}.pdf`
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});