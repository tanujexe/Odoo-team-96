import fs from 'fs';

const filePath = 'c:/Collage/peoplepay_odoo/Odoo-team-96/client/src/features/employees/index.jsx';
let content = fs.readFileSync(filePath, 'utf8');

const workspaceModalCode = `      {selectedEmployeeId && (
        <Modal
          isOpen={!!selectedEmployeeId}
          onClose={() => setSelectedEmployeeId(null)}
          title="Employee Workspace"
          description="Main employee form with related HR actions"
          maxWidth="max-w-4xl"
        >
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {detailData ? \`\${detailData.firstName || ''} \${detailData.lastName || ''}\`.trim() || detailData.name : 'Employee Workspace'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {detailData?.jobTitle || 'Staff Member'} • {detailData?.department || 'Engineering'} • {detailData?.employeeCode || 'EMP-001'}
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">Active</span>
            </div>

            <div className="flex items-center gap-6 border-b border-slate-200 text-xs font-bold text-slate-500 pb-1">
              <button type="button" className="pb-2 text-slate-900 border-b-2 border-slate-900 font-extrabold">Work Information</button>
              <button type="button" className="pb-2 hover:text-slate-700">Contracts</button>
              <button type="button" className="pb-2 hover:text-slate-700">Attendance</button>
              <button type="button" className="pb-2 hover:text-slate-700">Time Off</button>
              <button type="button" className="pb-2 hover:text-slate-700">Payroll & Payslips</button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs py-2">
              <div className="p-3 bg-slate-50/60 rounded-lg border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Work Email</span>
                <p className="font-mono font-semibold text-slate-800">{detailData?.email || 'employee@company.com'}</p>
              </div>
              <div className="p-3 bg-slate-50/60 rounded-lg border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Employee Code</span>
                <p className="font-mono font-semibold text-slate-800">{detailData?.employeeCode || 'EMP-001'}</p>
              </div>
              <div className="p-3 bg-slate-50/60 rounded-lg border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Contracts Summary</span>
                <p className="font-semibold text-slate-800">1 Active Employment Contract</p>
              </div>
              <div className="p-3 bg-slate-50/60 rounded-lg border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Attendance & Leave</span>
                <p className="font-semibold text-emerald-600">98.5% Present • 14 Days PTO</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setSelectedEmployeeId(null)}>Close Workspace</Button>
            </div>
          </div>
        </Modal>
      )}

`;

content = content.replace(
  "{isCreateModalOpen && (",
  workspaceModalCode + "      {isCreateModalOpen && ("
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully added Workspace Modal to employees/index.jsx');
