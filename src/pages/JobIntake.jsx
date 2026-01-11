import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Upload, Loader2, CheckCircle, Tag } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import LineDrawingFields from '../components/intake/LineDrawingFields';
import VirtualPrototypeFields from '../components/intake/VirtualPrototypeFields';
import UserContactInfo from '../components/intake/UserContactInfo';
import { toast } from 'sonner';
import { getWordPressUser, isAuthenticated } from '../components/utils/wordpressAuth';

export default function JobIntake() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const draftId = searchParams.get('draftId');
  const packageId = searchParams.get('packageId');
  const packageType = searchParams.get('type'); // 'vp' or 'ss'
  const [user, setUser] = useState(null);
  const [packageJob, setPackageJob] = useState(null);
  const [draftJob, setDraftJob] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [jobName, setJobName] = useState('');
  const [coachName, setCoachName] = useState('');
  const [howHeard, setHowHeard] = useState('');
  const [memberStatus, setMemberStatus] = useState('');
  const [category, setCategory] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [sellSheetLayout, setSellSheetLayout] = useState('');
  
  // Layout-specific fields
  const [photoDescription, setPhotoDescription] = useState('');
  const [problemPhotoFile, setProblemPhotoFile] = useState('');
  const [solutionPhotoFile, setSolutionPhotoFile] = useState('');
  const [problemSolutionDescription, setProblemSolutionDescription] = useState('');
  const [storyboard1File, setStoryboard1File] = useState('');
  const [storyboard2File, setStoryboard2File] = useState('');
  const [storyboard3File, setStoryboard3File] = useState('');
  const [storyboardDescription, setStoryboardDescription] = useState('');
  
  // Common fields
  const [benefitStatement, setBenefitStatement] = useState('');
  const [bulletPoints, setBulletPoints] = useState('');
  const [videoLink, setVideoLink] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [legalInfo, setLegalInfo] = useState([]);
  
  // Voucher and checkout
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [checkingVoucher, setCheckingVoucher] = useState(false);
  
  const [formData, setFormData] = useState({});
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const autoSaveTimeout = useRef(null);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (draftId && user) {
      loadDraft();
    }
    if (packageId && user) {
      loadPackage();
    }
  }, [draftId, user, packageId]);

  const loadPackage = async () => {
    try {
      const jobs = await base44.entities.Job.filter({ id: packageId });
      if (jobs.length > 0) {
        const pkg = jobs[0];
        setPackageJob(pkg);
        
        // Pre-select department based on package type
        const vpDept = departments.find(d => d.name === 'Virtual Prototypes');
        const ssDept = departments.find(d => d.name === 'Sell Sheets');
        
        if (packageType === 'vp' && vpDept) {
          setSelectedDepartment(vpDept.id);
          setJobName(pkg.form_data?.productName || '');
        } else if (packageType === 'ss' && ssDept) {
          setSelectedDepartment(ssDept.id);
          setJobName(pkg.form_data?.productName || '');
        }
      }
    } catch (error) {
      console.error('Error loading package:', error);
    }
  };

  const loadUser = () => {
    if (!isAuthenticated()) {
      navigate(createPageUrl('WordPressLogin'));
      return;
    }
    const userData = getWordPressUser();
    setUser(userData);
  };

  const handleUserInfoUpdate = (updatedInfo) => {
    // Update local state and localStorage
    const updatedUser = { ...user, ...updatedInfo };
    setUser(updatedUser);
    localStorage.setItem('user_data', JSON.stringify(updatedUser));
    toast.success('Contact information updated');
  };

  const loadDraft = async () => {
    try {
      const draft = await base44.entities.Job.filter({ id: draftId, status: 'Draft' });
      if (draft.length > 0) {
        const draftData = draft[0];
        setDraftJob(draftData);
        
        const saved = draftData.draft_data || {};
        setJobName(saved.jobName || '');
        setSelectedDepartment(saved.selectedDepartment || '');
        setCoachName(saved.coachName || '');
        setHowHeard(saved.howHeard || '');
        setMemberStatus(saved.memberStatus || '');
        setCategory(saved.category || '');
        setProductDescription(saved.productDescription || '');
        setSellSheetLayout(saved.sellSheetLayout || '');
        setPhotoDescription(saved.photoDescription || '');
        setProblemPhotoFile(saved.problemPhotoFile || '');
        setSolutionPhotoFile(saved.solutionPhotoFile || '');
        setProblemSolutionDescription(saved.problemSolutionDescription || '');
        setStoryboard1File(saved.storyboard1File || '');
        setStoryboard2File(saved.storyboard2File || '');
        setStoryboard3File(saved.storyboard3File || '');
        setStoryboardDescription(saved.storyboardDescription || '');
        setBenefitStatement(saved.benefitStatement || '');
        setBulletPoints(saved.bulletPoints || '');
        setVideoLink(saved.videoLink || '');
        setAdditionalInfo(saved.additionalInfo || '');
        setLegalInfo(saved.legalInfo || []);
        setFormData(saved.formData || {});
        
        toast.success('Draft loaded successfully');
      }
    } catch (error) {
      console.error('Error loading draft:', error);
      toast.error('Failed to load draft');
    }
  };

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const depts = await base44.entities.Department.filter({ active: true });
      // Filter out Design Package from regular job intake
      return depts.filter(d => d.name !== 'Design Package');
    },
    initialData: []
  });

  // Designers list is not needed for client job submission
  const designers = [];

  const saveDraftMutation = useMutation({
    mutationFn: async (draftData) => {
      if (draftJob) {
        return await base44.entities.Job.update(draftJob.id, draftData);
      } else {
        return await base44.entities.Job.create(draftData);
      }
    },
    onSuccess: (savedJob) => {
      if (!draftJob) {
        setDraftJob(savedJob);
        navigate(createPageUrl('JobIntake') + `?draftId=${savedJob.id}`, { replace: true });
      }
      queryClient.invalidateQueries({ queryKey: ['client-jobs'] });
    }
  });

  const autoSave = () => {
    if (!user) return;
    
    if (autoSaveTimeout.current) {
      clearTimeout(autoSaveTimeout.current);
    }

    autoSaveTimeout.current = setTimeout(() => {
      const draftData = {
        jobName,
        selectedDepartment,
        coachName,
        howHeard,
        memberStatus,
        category,
        productDescription,
        sellSheetLayout,
        photoDescription,
        problemPhotoFile,
        solutionPhotoFile,
        problemSolutionDescription,
        storyboard1File,
        storyboard2File,
        storyboard3File,
        storyboardDescription,
        benefitStatement,
        bulletPoints,
        videoLink,
        additionalInfo,
        legalInfo,
        formData
      };

      const clientName = user.first_name && user.last_name 
        ? `${user.first_name} ${user.last_name}` 
        : user.full_name || user.email;
      
      saveDraftMutation.mutate({
        job_number: draftJob?.job_number || `DRAFT-${Date.now()}`,
        job_name: jobName || 'Untitled Draft',
        client_id: user.id,
        client_name: clientName,
        department_id: selectedDepartment || null,
        department_name: departments.find(d => d.id === selectedDepartment)?.name || null,
        status: 'Draft',
        draft_data: draftData,
        last_activity_date: new Date().toISOString()
      });
    }, 2000);
  };

  useEffect(() => {
    if (user && (jobName || selectedDepartment || coachName || howHeard || memberStatus)) {
      autoSave();
    }
  }, [jobName, selectedDepartment, coachName, howHeard, memberStatus, category, productDescription, 
      sellSheetLayout, photoDescription, problemPhotoFile, solutionPhotoFile, problemSolutionDescription,
      storyboard1File, storyboard2File, storyboard3File, storyboardDescription, benefitStatement,
      bulletPoints, videoLink, additionalInfo, legalInfo, formData]);

  const submitJobMutation = useMutation({
    mutationFn: async (jobData) => {
      if (draftJob) {
        return await base44.entities.Job.update(draftJob.id, jobData);
      } else {
        return await base44.entities.Job.create(jobData);
      }
    },
    onSuccess: async (newJob) => {
      queryClient.invalidateQueries({ queryKey: ['client-jobs'] });
      
      const department = departments.find(d => d.id === selectedDepartment);
      
      // For package jobs, skip checkout (already paid)
      if (packageJob) {
        toast.success('Job submitted successfully!');
        navigate(createPageUrl('JobDetail') + `?id=${newJob.id}`);
      }
      // For Sell Sheets, Line Drawings, or Virtual Prototypes, redirect to checkout
      else if (department?.name === 'Sell Sheets' || department?.name === 'Line Drawings' || department?.name === 'Virtual Prototypes') {
        const finalPrice = calculateFinalPrice();
        const { data } = await base44.functions.invoke('createStripeCheckout', {
          jobId: newJob.id,
          amount: finalPrice,
          voucherCode: appliedVoucher?.code
        });
        
        if (data.url) {
          window.location.href = data.url;
        }
      } else {
        toast.success('Job submitted successfully!');
        navigate(createPageUrl('JobDetail') + `?id=${newJob.id}`);
      }
    },
    onError: () => {
      toast.error('Failed to submit job. Please try again.');
    }
  });

  const department = departments.find(d => d.id === selectedDepartment);
  const isSellSheets = department?.name === 'Sell Sheets';
  const isLineDrawing = department?.name === 'Line Drawings';
  const isVirtualPrototype = department?.name === 'Virtual Prototypes';

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setFiles([...files, ...newFiles]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles([...files, ...droppedFiles]);
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleLegalInfoChange = (value, checked) => {
    if (checked) {
      setLegalInfo([...legalInfo, value]);
    } else {
      setLegalInfo(legalInfo.filter(item => item !== value));
    }
  };

  const applyVoucher = async () => {
    if (!voucherCode.trim()) {
      toast.error('Please enter a voucher code');
      return;
    }

    setCheckingVoucher(true);
    try {
      const vouchers = await base44.entities.VoucherCode.filter({ 
        code: voucherCode.trim(), 
        active: true 
      });

      if (vouchers.length === 0) {
        toast.error('Invalid voucher code');
        setAppliedVoucher(null);
        return;
      }

      const voucher = vouchers[0];

      if (voucher.expiration_date && new Date(voucher.expiration_date) < new Date()) {
        toast.error('This voucher has expired');
        setAppliedVoucher(null);
        return;
      }

      const usages = await base44.entities.VoucherUsage.filter({
        voucher_code_id: voucher.id,
        user_id: user.id
      });

      if (usages.length >= voucher.uses_per_user) {
        toast.error('You have already used this voucher');
        setAppliedVoucher(null);
        return;
      }

      setAppliedVoucher(voucher);
      toast.success('Voucher applied successfully!');
    } catch (error) {
      console.error('Voucher error:', error);
      toast.error('Error applying voucher');
    } finally {
      setCheckingVoucher(false);
    }
  };

  const calculateFinalPrice = () => {
    let basePrice = 249; // Default for Sell Sheets
    
    if (isLineDrawing && formData.numberOfDrawings) {
      basePrice = parseInt(formData.numberOfDrawings) * 30;
    }
    
    if (isVirtualPrototype) {
      basePrice = 499; // Base price for Virtual Prototype
      if (formData.arUpgrade) basePrice += 99;
      if (formData.arVirtualPrototype) basePrice += 99;
      if (formData.animatedVideo === 'rotation') basePrice += 300;
      if (formData.animatedVideo === 'exploded') basePrice += 350;
      if (formData.animatedVideo === 'both') basePrice += 400;
    }
    
    if (!appliedVoucher) return basePrice;

    if (appliedVoucher.discount_type === 'flat') {
      return Math.max(0, basePrice - appliedVoucher.discount_amount);
    } else {
      return Math.max(0, basePrice * (1 - appliedVoucher.discount_amount / 100));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!jobName || !selectedDepartment) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (isSellSheets && !sellSheetLayout) {
      toast.error('Please select a sell sheet layout');
      return;
    }

    if (isLineDrawing && (!formData.virtualPrototype || !formData.drawingType || !formData.numberOfDrawings)) {
      toast.error('Please complete all required Line Drawing fields');
      return;
    }

    setUploading(true);

    try {
      const uploadedFiles = [];
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        uploadedFiles.push({
          file_name: file.name,
          file_url,
          file_type: file.type,
          file_size: file.size
        });
      }

      const jobNumber = `JOB-${Date.now()}`;
      
      const departmentDesigners = designers.filter(d => d.department === department.name);
      const assignedDesigner = departmentDesigners[0] || designers[0];

      const sellSheetData = isSellSheets ? {
        'Category': category,
        'Product Description': productDescription,
        'Benefit Statement': benefitStatement,
        'Bullet Points': bulletPoints,
        'Video Link': videoLink,
        'Legal Info': legalInfo,
        'Additional Information': additionalInfo,
        'Sell Sheet Layout': sellSheetLayout,
        ...(sellSheetLayout === 'Standard Layout' && {
          'Photo Description': photoDescription
        }),
        ...(sellSheetLayout === 'Problem vs. Solution' && {
          'Problem Photo File': problemPhotoFile,
          'Solution Photo File': solutionPhotoFile,
          'Problem/Solution Description': problemSolutionDescription
        }),
        ...(sellSheetLayout === 'Storyboard' && {
          'Storyboard Photo 1 File': storyboard1File,
          'Storyboard Photo 2 File': storyboard2File,
          'Storyboard Photo 3 File': storyboard3File,
          'Storyboard Description': storyboardDescription
        })
      } : {};

      const clientName = user.first_name && user.last_name 
        ? `${user.first_name} ${user.last_name}` 
        : user.full_name || user.email;
      
      const jobData = {
        job_number: jobNumber,
        job_name: jobName,
        department_id: selectedDepartment,
        department_name: department.name,
        client_id: user.id,
        client_name: clientName,
        client_first_name: user.first_name || '',
        client_last_name: user.last_name || '',
        client_email: user.email || '',
        client_phone: user.phone || '',
        designer_id: assignedDesigner?.id,
        designer_name: assignedDesigner?.full_name,
        status: 'New Job',
        form_data: {
          ...formData,
          ...sellSheetData,
          'Coach Name': coachName,
          'How did you hear about us?': howHeard,
          'Are You A Current/Former inventRight Member?': memberStatus
        },
        ...(packageJob && {
          package_type: packageType === 'vp' ? 'package_vp' : 'package_ss',
          parent_package_id: packageJob.id
        }),
        last_activity_date: new Date().toISOString()
      };

      const newJob = await submitJobMutation.mutateAsync(jobData);

      // Update package job with child job IDs
      if (packageJob) {
        const updateData = {};
        if (packageType === 'vp') {
          updateData.package_vp_job_id = newJob.id;
          updateData.package_vp_started = true;
        } else if (packageType === 'ss') {
          updateData.package_ss_job_id = newJob.id;
          updateData.package_ss_started = true;
        }
        await base44.entities.Job.update(packageJob.id, updateData);
      }

      // Upload files to Google Drive
      if (uploadedFiles.length > 0) {
        const driveResponse = await base44.functions.invoke('uploadToGoogleDrive', {
          files: uploadedFiles,
          jobNumber: jobNumber,
          clientName: clientName,
          productName: jobName
        });

        if (driveResponse.data.success) {
          // Update job with Google Drive folder info
          await base44.entities.Job.update(newJob.id, {
            google_drive_folder_id: driveResponse.data.folder_id,
            google_drive_folder_url: driveResponse.data.folder_url
          });

          // Create file upload records with Google Drive IDs
          for (const file of driveResponse.data.files) {
            await base44.entities.FileUpload.create({
              job_id: newJob.id,
              uploader_id: user.id,
              uploader_name: clientName,
              ...file
            });
          }
        }
      }

      const messageContent = packageJob 
        ? `New job submitted: ${jobName}\n\nNote: This is part of a Design Package Order${packageType === 'vp' ? ' - You must complete the job and close it before moving on to your Sell Sheet.' : ''}`
        : `New job submitted: ${jobName}`;
      
      await base44.entities.Message.create({
        job_id: newJob.id,
        sender_id: user.id,
        sender_name: clientName,
        sender_role: 'client',
        content: messageContent
      });

      if (appliedVoucher) {
        let basePrice = 249;
        if (isLineDrawing) basePrice = parseInt(formData.numberOfDrawings) * 30;
        if (isVirtualPrototype) {
          basePrice = 499;
          if (formData.arUpgrade) basePrice += 99;
          if (formData.arVirtualPrototype) basePrice += 99;
          if (formData.animatedVideo === 'rotation') basePrice += 300;
          if (formData.animatedVideo === 'exploded') basePrice += 350;
          if (formData.animatedVideo === 'both') basePrice += 400;
        }
        await base44.entities.VoucherUsage.create({
          voucher_code_id: appliedVoucher.id,
          user_id: user.id,
          job_id: newJob.id,
          discount_applied: basePrice - calculateFinalPrice()
        });
      }

    } catch (error) {
      console.error('Error submitting job:', error);
      toast.error('Failed to submit job');
      setUploading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <GlassCard className="p-8">
          <Loader2 className="w-8 h-8 animate-spin text-[#4791FF]" />
        </GlassCard>
      </div>
    );
  }

  const getBasePrice = () => {
    // Free for package jobs
    if (packageJob) return 0;
    
    if (isLineDrawing && formData.numberOfDrawings) {
      return parseInt(formData.numberOfDrawings) * 30;
    }
    if (isVirtualPrototype) {
      let price = 499;
      if (formData.arUpgrade) price += 99;
      if (formData.arVirtualPrototype) price += 99;
      if (formData.animatedVideo === 'rotation') price += 300;
      if (formData.animatedVideo === 'exploded') price += 350;
      if (formData.animatedVideo === 'both') price += 400;
      return price;
    }
    return 249;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Button
        variant="ghost"
        onClick={() => navigate(createPageUrl('ClientDashboard'))}
        className="mb-6 text-gray-700 hover:text-black"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Button>

      <UserContactInfo user={user} onUpdate={handleUserInfoUpdate} />

      <GlassCard>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#0D1238] mb-2">
            {packageJob ? `Design Package: ${packageType === 'vp' ? 'Virtual Prototype' : 'Sell Sheet'}` : 'Submit New Job'}
          </h1>
          <p className="text-gray-700">
            {packageJob 
              ? `Complete your ${packageType === 'vp' ? 'Virtual Prototype' : 'Sell Sheet'} request (FREE as part of your Design Package)`
              : 'Fill out the form below to submit your design job'}
          </p>
          {packageJob && packageType === 'vp' && (
            <p className="text-amber-700 font-semibold mt-3 p-3 bg-amber-50 rounded-lg">
              Note: You must complete and close this Virtual Prototype job before moving on to your Sell Sheet.
            </p>
          )}
          {(isSellSheets || isLineDrawing || isVirtualPrototype) && !packageJob && (
            <p className="text-black font-bold mt-4">
              You will upload all of your images, documents and files at the bottom of the form.
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Coach Name */}
          <div className="space-y-2">
            <Label htmlFor="coachName" className="text-black">
              Coach Name (If Applicable)
            </Label>
            <Input
              id="coachName"
              value={coachName}
              onChange={(e) => setCoachName(e.target.value)}
              placeholder="Enter coach name"
              className="glass border-[#4791FF]/30 text-black placeholder:text-gray-500"
            />
          </div>

          {/* How did you hear about us? */}
          <div className="space-y-3">
            <Label className="text-black">How did you hear about us?</Label>
            <RadioGroup value={howHeard} onValueChange={setHowHeard}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Current/Former Student" id="heard-student" />
                <Label htmlFor="heard-student" className="text-black font-normal cursor-pointer">
                  Current/Former Student
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="LinkedIn Advertising" id="heard-linkedin" />
                <Label htmlFor="heard-linkedin" className="text-black font-normal cursor-pointer">
                  LinkedIn Advertising
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Google Search" id="heard-google" />
                <Label htmlFor="heard-google" className="text-black font-normal cursor-pointer">
                  Google Search
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="inventRight Website" id="heard-website" />
                <Label htmlFor="heard-website" className="text-black font-normal cursor-pointer">
                  inventRight Website
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="YouTube" id="heard-youtube" />
                <Label htmlFor="heard-youtube" className="text-black font-normal cursor-pointer">
                  YouTube
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Are You A Current/Former inventRight Member? */}
          <div className="space-y-3">
            <Label className="text-black">Are You A Current/Former inventRight Member?</Label>
            <RadioGroup value={memberStatus} onValueChange={setMemberStatus}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="I am a Current Member" id="member-current" />
                <Label htmlFor="member-current" className="text-black font-normal cursor-pointer">
                  I am a Current Member
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="I am a Past Member" id="member-past" />
                <Label htmlFor="member-past" className="text-black font-normal cursor-pointer">
                  I am a Past Member
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="I've never been an inventRight Member" id="member-never" />
                <Label htmlFor="member-never" className="text-black font-normal cursor-pointer">
                  I've never been an inventRight Member
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Product Name */}
          <div className="space-y-2">
            <Label htmlFor="jobName" className="text-black">
              Product Name *
            </Label>
            <Input
              id="jobName"
              value={jobName}
              onChange={(e) => setJobName(e.target.value)}
              placeholder="Enter product name"
              className="glass border-[#4791FF]/30 text-black placeholder:text-gray-500"
              required
            />
          </div>

          {/* Department Selection */}
          <div className="space-y-2">
            <Label htmlFor="department" className="text-black">
              Design Studio Service *
            </Label>
            <Select 
              value={selectedDepartment} 
              onValueChange={setSelectedDepartment} 
              required
              disabled={!!packageJob}
            >
              <SelectTrigger className="glass border-[#4791FF]/30 text-black">
                <SelectValue placeholder="Select service" />
              </SelectTrigger>
              <SelectContent>
                {departments.map(dept => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {packageJob && (
              <p className="text-sm text-gray-600">Service pre-selected as part of your Design Package</p>
            )}
          </div>

          {/* Line Drawing Service Fields */}
          {isLineDrawing && (
            <LineDrawingFields formData={formData} setFormData={setFormData} />
          )}

          {/* Virtual Prototype Fields */}
          {isVirtualPrototype && (
            <VirtualPrototypeFields formData={formData} setFormData={setFormData} />
          )}

          {/* Sell Sheets Specific Fields */}
          {isSellSheets && (
            <>
              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category" className="text-black">
                  What category best describes your invention?
                </Label>
                <Input
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Enter category"
                  className="glass border-[#4791FF]/30 text-black placeholder:text-gray-500"
                />
              </div>

              {/* Product Description */}
              <div className="space-y-2">
                <Label htmlFor="productDescription" className="text-black">
                  Product Description
                </Label>
                <Textarea
                  id="productDescription"
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  placeholder="Write a short paragraph describing your invention. What are the issues? When, where and how will your product be used?"
                  className="glass border-[#4791FF]/30 text-black placeholder:text-gray-500 min-h-32"
                />
              </div>

              {/* Common Sell Sheet Fields - Moved above layout selection */}
              <div className="space-y-2">
                <Label htmlFor="benefitStatement" className="text-black">
                  One Sentence Benefit Statement
                </Label>
                <Input
                  id="benefitStatement"
                  value={benefitStatement}
                  onChange={(e) => setBenefitStatement(e.target.value)}
                  placeholder="Enter one sentence benefit statement"
                  className="glass border-[#4791FF]/30 text-black placeholder:text-gray-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bulletPoints" className="text-black">
                  List up to 5 bulleted benefit points
                </Label>
                <Textarea
                  id="bulletPoints"
                  value={bulletPoints}
                  onChange={(e) => setBulletPoints(e.target.value)}
                  placeholder="Enter benefit points (one per line)"
                  className="glass border-[#4791FF]/30 text-black placeholder:text-gray-500 min-h-24"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="videoLink" className="text-black">
                  Video link if available
                </Label>
                <Input
                  id="videoLink"
                  value={videoLink}
                  onChange={(e) => setVideoLink(e.target.value)}
                  placeholder="Enter video URL"
                  className="glass border-[#4791FF]/30 text-black placeholder:text-gray-500"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-black">Additional info/legal on sell sheet</Label>
                <div className="space-y-2">
                  {['Your Contact Information', 'Patent Pending', 'Patented', 'Available for Licensing', 'Disclaimer: Any use of copyrighted or trademarked materials are for illustrative purposes only.'].map((item) => (
                    <div key={item} className="flex items-center space-x-2">
                      <Checkbox
                        id={item}
                        checked={legalInfo.includes(item)}
                        onCheckedChange={(checked) => handleLegalInfoChange(item, checked)}
                      />
                      <Label htmlFor={item} className="text-black font-normal cursor-pointer">
                        {item}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="additionalInfo" className="text-black">
                  Additional information
                </Label>
                <Textarea
                  id="additionalInfo"
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  placeholder="Enter any additional information"
                  className="glass border-[#4791FF]/30 text-black placeholder:text-gray-500 min-h-24"
                />
              </div>

              {/* Sell Sheet Layout Samples Image */}
              <div className="my-6">
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/691b56b689c37c23de922f3d/8fca309e8_sssamples.jpeg"
                  alt="Sell Sheet Layout Samples"
                  className="w-full rounded-lg shadow-md"
                />
              </div>

              {/* Sell Sheet Layout */}
              <div className="space-y-3">
                <Label className="text-black">Choose a Sell Sheet Layout *</Label>
                <RadioGroup value={sellSheetLayout} onValueChange={setSellSheetLayout}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Standard Layout" id="layout-standard" />
                    <Label htmlFor="layout-standard" className="text-black font-normal cursor-pointer">
                      Standard Layout
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Problem vs. Solution" id="layout-problem" />
                    <Label htmlFor="layout-problem" className="text-black font-normal cursor-pointer">
                      Problem vs. Solution
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Storyboard" id="layout-storyboard" />
                    <Label htmlFor="layout-storyboard" className="text-black font-normal cursor-pointer">
                      Storyboard
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Standard Layout Fields */}
              {sellSheetLayout === 'Standard Layout' && (
                <div className="space-y-2">
                  <Label htmlFor="photoDescription" className="text-black">
                    Upload your photos to be used with your sell sheet below and Describe how these photos should be used/manipulated for your sell sheet.
                  </Label>
                  <Textarea
                    id="photoDescription"
                    value={photoDescription}
                    onChange={(e) => setPhotoDescription(e.target.value)}
                    placeholder="Describe how photos should be used"
                    className="glass border-[#4791FF]/30 text-black placeholder:text-gray-500 min-h-24"
                  />
                </div>
              )}

              {/* Problem vs. Solution Fields */}
              {sellSheetLayout === 'Problem vs. Solution' && (
                <>
                  <p className="text-black">Upload your Problem/Solution images below and give us the file names and how to use them here:</p>
                  <div className="space-y-2">
                    <Label htmlFor="problemPhotoFile" className="text-black">
                      Name of Problem Photo File:
                    </Label>
                    <Input
                      id="problemPhotoFile"
                      value={problemPhotoFile}
                      onChange={(e) => setProblemPhotoFile(e.target.value)}
                      placeholder="Problem photo filename"
                      className="glass border-[#4791FF]/30 text-black placeholder:text-gray-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="solutionPhotoFile" className="text-black">
                      Name of the Solution Photo File:
                    </Label>
                    <Input
                      id="solutionPhotoFile"
                      value={solutionPhotoFile}
                      onChange={(e) => setSolutionPhotoFile(e.target.value)}
                      placeholder="Solution photo filename"
                      className="glass border-[#4791FF]/30 text-black placeholder:text-gray-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="problemSolutionDescription" className="text-black">
                      Describe how these photos should be used/manipulated for your Problem/Solution sell sheet:
                    </Label>
                    <Textarea
                      id="problemSolutionDescription"
                      value={problemSolutionDescription}
                      onChange={(e) => setProblemSolutionDescription(e.target.value)}
                      placeholder="Describe how photos should be used"
                      className="glass border-[#4791FF]/30 text-black placeholder:text-gray-500 min-h-24"
                    />
                  </div>
                </>
              )}

              {/* Storyboard Fields */}
              {sellSheetLayout === 'Storyboard' && (
                <>
                  <p className="text-black">Upload your three storyboard images below and then give the file names and how we should use them here:</p>
                  <div className="space-y-2">
                    <Label htmlFor="storyboard1File" className="text-black">
                      Storyboard Photo 1 File Name:
                    </Label>
                    <Input
                      id="storyboard1File"
                      value={storyboard1File}
                      onChange={(e) => setStoryboard1File(e.target.value)}
                      placeholder="Photo 1 filename"
                      className="glass border-[#4791FF]/30 text-black placeholder:text-gray-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="storyboard2File" className="text-black">
                      Storyboard Photo 2 File Name:
                    </Label>
                    <Input
                      id="storyboard2File"
                      value={storyboard2File}
                      onChange={(e) => setStoryboard2File(e.target.value)}
                      placeholder="Photo 2 filename"
                      className="glass border-[#4791FF]/30 text-black placeholder:text-gray-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="storyboard3File" className="text-black">
                      Storyboard Photo 3 File Name:
                    </Label>
                    <Input
                      id="storyboard3File"
                      value={storyboard3File}
                      onChange={(e) => setStoryboard3File(e.target.value)}
                      placeholder="Photo 3 filename"
                      className="glass border-[#4791FF]/30 text-black placeholder:text-gray-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="storyboardDescription" className="text-black">
                      Describe how these photos should be used/manipulated for your Storyboard sell sheet:
                    </Label>
                    <Textarea
                      id="storyboardDescription"
                      value={storyboardDescription}
                      onChange={(e) => setStoryboardDescription(e.target.value)}
                      placeholder="Describe how photos should be used"
                      className="glass border-[#4791FF]/30 text-black placeholder:text-gray-500 min-h-24"
                    />
                  </div>
                </>
              )}
            </>
          )}

          {/* Dynamic form fields based on department (for non-Sell Sheets, non-Line Drawing, and non-Virtual Prototype) */}
          {!isSellSheets && !isLineDrawing && !isVirtualPrototype && department?.form_fields?.map((field, index) => (
            <div key={index} className="space-y-2">
              <Label htmlFor={`field-${index}`} className="text-black">
                {field.label} {field.required && '*'}
              </Label>
              {field.type === 'textarea' ? (
                <Textarea
                  id={`field-${index}`}
                  value={formData[field.label] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.label]: e.target.value })}
                  placeholder={field.label}
                  className="glass border-[#4791FF]/30 text-black placeholder:text-gray-500"
                  required={field.required}
                />
              ) : field.type === 'select' ? (
                <Select
                  value={formData[field.label] || ''}
                  onValueChange={(value) => setFormData({ ...formData, [field.label]: value })}
                  required={field.required}
                >
                  <SelectTrigger className="glass border-[#4791FF]/30 text-black">
                    <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map(option => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id={`field-${index}`}
                  type={field.type || 'text'}
                  value={formData[field.label] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.label]: e.target.value })}
                  placeholder={field.label}
                  className="glass border-[#4791FF]/30 text-black placeholder:text-gray-500"
                  required={field.required}
                />
              )}
            </div>
          ))}

          {/* File Upload - Hide for Design Package */}
          {!packageJob && (
          <div className="space-y-2">
            <Label className="text-black">Upload Files</Label>
            <div 
              className={`glass border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                isDragging ? 'border-[#4791FF] bg-blue-50' : 'border-[#4791FF]/30'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-12 h-12 mx-auto mb-4 text-[#4791FF]" />
                <p className="text-gray-700 mb-2">Click to upload files</p>
                <p className="text-gray-500 text-sm">or drag and drop</p>
              </label>
            </div>
            
            {files.length > 0 && (
              <div className="space-y-2 mt-4">
                {files.map((file, index) => (
                  <div key={index} className="glass flex items-center justify-between p-3 rounded-lg">
                    <span className="text-black text-sm">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="text-gray-600 hover:text-black"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          )}

          {/* Voucher Code */}
          {(isSellSheets || isLineDrawing || isVirtualPrototype) && !packageJob && (
            <GlassCard variant="strong" className="p-4">
              <h3 className="text-lg font-semibold text-black mb-3">Voucher Code</h3>
              <div className="flex gap-2">
                <Input
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value)}
                  placeholder="Enter voucher code"
                  className="glass border-[#4791FF]/30 text-black placeholder:text-gray-500"
                  disabled={appliedVoucher}
                />
                <Button
                  type="button"
                  onClick={applyVoucher}
                  disabled={checkingVoucher || appliedVoucher}
                  className="bg-[#4791FF] hover:bg-[#3680ee] text-white"
                >
                  {checkingVoucher ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Tag className="w-4 h-4" />
                  )}
                </Button>
              </div>
              {appliedVoucher && (
                <div className="mt-3 p-3 bg-green-100 rounded-lg">
                  <p className="text-green-800 text-sm font-medium">
                    Voucher applied: {appliedVoucher.discount_type === 'flat' 
                      ? `$${appliedVoucher.discount_amount} off` 
                      : `${appliedVoucher.discount_amount}% off`}
                  </p>
                </div>
              )}
            </GlassCard>
          )}

          {/* Pricing Summary */}
          {(isSellSheets || isLineDrawing || isVirtualPrototype) && !packageJob && (
            <GlassCard variant="strong" className="p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-black">Base Price:</span>
                <span className="text-black font-semibold">
                  ${getBasePrice().toFixed(2)}
                </span>
              </div>
              {appliedVoucher && (
                <div className="flex justify-between items-center mb-2 text-green-700">
                  <span>Discount:</span>
                  <span>
                    -${(getBasePrice() - calculateFinalPrice()).toFixed(2)}
                  </span>
                </div>
              )}
              <div className="border-t border-[#4791FF]/30 pt-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-black font-bold">Total:</span>
                  <span className="text-black font-bold text-xl">${calculateFinalPrice().toFixed(2)}</span>
                </div>
              </div>
            </GlassCard>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-[#4791FF] hover:bg-[#3680ee] text-white"
            disabled={uploading || !jobName || !selectedDepartment}
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (isSellSheets || isLineDrawing || isVirtualPrototype) && !packageJob ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Proceed to Checkout
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Submit Job
              </>
            )}
          </Button>
        </form>
      </GlassCard>
    </div>
  );
}