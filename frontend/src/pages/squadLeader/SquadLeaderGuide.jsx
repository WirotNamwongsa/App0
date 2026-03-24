import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Users, UserPlus, Calendar, FileText, Shield, Star, Target, Award, BookOpen, MessageCircle, HelpCircle, CheckCircle, AlertCircle, Clock, MapPin } from 'lucide-react';

export default function SquadLeaderGuide() {
  const [expandedSection, setExpandedSection] = useState(null);

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const guideSections = [
    {
      id: 'overview',
      title: 'บทนำ และบทบาทของผู้กำกับหมู่',
      icon: Users,
      content: [
        {
          title: 'ผู้กำกับหมู่คือใคร?',
          description: 'ผู้กำกับหมู่คือผู้นำที่รับผิดชอบดูแลและควบคุมลูกเสือในหมู่ของตน โดยมีหน้าที่สำคัญในการพัฒนาทักษะ ค่านิยม และวินัยของลูกเสือ'
        },
        {
          title: 'บทบาทหลัก',
          description: '• ดูแลความปลอดภัยของลูกเสือในหมู่\n• สอนและพัฒนาทักษะการเป็นลูกเสือ\n• สร้างความสามัคคีในหมู่\n• เป็นแบบอย่างที่ดีให้ลูกเสือ\n• ประสานงานกับผู้กำกับกองและผู้จัดกิจกรรม'
        },
        {
          title: 'คุณสมบัติที่ควรมี',
          description: '• มีความรับผิดชอบสูง\n• มีความเข้าใจในหลักการลูกเสือ\n• สามารถสื่อสารได้ดี\n• มีความอดทนและเข้าใจเด็ก\n• มีทักษะการนำทีม'
        }
      ]
    },
    {
      id: 'squad-management',
      title: 'การจัดการหมู่',
      icon: Shield,
      content: [
        {
          title: 'การจัดตั้งหมู่',
          description: '• หมู่ลูกเสือประกอบด้วยสมาชิก 6-8 คน\n• มีผู้กำกับหมู่ 1 คน\n• มีผู้ช่วยผู้กำกับหมู่ 1 คน (ถ้ามี)\n• มีสัญลักษณ์และชื่อของหมู่'
        },
        {
          title: 'การเพิ่มสมาชิก',
          description: '1. คลิกปุ่ม "เพิ่มลูกเสือ" ที่หน้าหลัก\n2. กรอกข้อมูลลูกเสือให้ครบถ้วน\n3. ตรวจสอบข้อมูลก่อนยืนยัน\n4. ระบบจะทำการบันทึกข้อมูลอัตโนมัติ'
        },
        {
          title: 'การจัดการสมาชิก',
          description: '• ตรวจสอบรายชื่อสมาชิกในหมู่\n• ดูข้อมูลส่วนตัวของลูกเสือ\n• นำลูกเสือออกจากหมู่เมื่อจำเป็น\n• ติดตามการเข้าร่วมกิจกรรม'
        }
      ]
    },
    {
      id: 'activities',
      title: 'การจัดกิจกรรม',
      icon: Star,
      content: [
        {
          title: 'ประเภทกิจกรรม',
          description: '• กิจกรรมประจำวัน: การฝึกทักษะพื้นฐาน\n• กิจกรรมสุดสัปดาห์: การออกค่ายและทัศนศึกษา\n• กิจกรรมพิเศษ: การแข่งขันและการแสดง\n• กิจกรรมบริการ: การทำประโยชน์เพื่อสังคม'
        },
        {
          title: 'การวางแผนกิจกรรม',
          description: '1. กำหนดวัตถุประสงค์ของกิจกรรม\n2. วางแผนขั้นตอนการดำเนินงาน\n3. เตรียมอุปกรณ์และสถานที่\n4. แจ้งกำหนดการให้ผู้ปกครองทราบ\n5. ดำเนินกิจกรรมตามแผน\n6. ประเมินผลและสรุปกิจกรรม'
        },
        {
          title: 'ความปลอดภัยในกิจกรรม',
          description: '• ตรวจสอบสถานที่ก่อนใช้\n• เตรียมอุปกรณ์ปฐมพยาบาล\n• แจ้งแผนการดำเนินงานให้ผู้บังคับบัญชาทราบ\n• มีผู้ดูแลเพียงพอต่อจำนวนเด็ก\n• ตรวจสอบสุขภาพของลูกเสือก่อนกิจกรรม'
        }
      ]
    },
    {
      id: 'skills',
      title: 'การพัฒนาทักษะลูกเสือ',
      icon: Target,
      content: [
        {
          title: 'ทักษะพื้นฐานที่ต้องสอน',
          description: '• การผูกมัดปมต่างๆ\n• การใช้เข็มทิศและแผนที่\n• การจัดการที่พักแรม\n• การปฐมพยาบาลเบื้องต้น\n• การสื่อสารด้วยสัญญาณ'
        },
        {
          title: 'การสอนทักษะ',
          description: '1. สาธิตวิธีทำอย่างชัดเจน\n2. ให้ลูกเสือลองทำตาม\n3. แก้ไขข้อผิดพลาดอย่างสร้างสรรค์\n4. ให้ฝึกซ้ำจนเกิดความคุ้นเคย\n5. ประเมินความก้าวหน้า'
        },
        {
          title: 'การสร้างแรงจูงใจ',
          description: '• ให้การยอมรับและชมเชย\n• มอบโอกาสให้แสดงความสามารถ\n• สร้างความท้าทายที่เหมาะสม\n• ให้รางวัลและการรับรองความสามารถ'
        }
      ]
    },
    {
      id: 'discipline',
      title: 'การสร้างวินัยและค่านิยม',
      icon: Award,
      content: [
        {
          title: 'หลักการสร้างวินัย',
          description: '• ตั้งกฎที่ชัดเจนและเหมาะสม\n• ใช้วิธีเสริมสร้างมากกว่าลงโทษ\n• สอดคล้องกับหลักการลูกเสือ\n• มีความยุติธรรมและสม่ำเสมอ'
        },
        {
          title: 'การแก้ปัญหาพฤติกรรม',
          description: '1. สังเกตและเข้าใจสาเหตุ\n2. คุยกับลูกเสืออย่างเป็นส่วนตัว\n3. ชี้แจงข้อผิดพลาดอย่างสร้างสรรค์\n4. แนะนำวิธีการที่ถูกต้อง\n5. ติดตามและให้การสนับสนุน'
        },
        {
          title: 'ค่านิยมที่ส่งเสริม',
          description: '• ความซื่อสัตย์และซื่อตรง\n• ความรับผิดชอบ\n• ความมีน้ำใจและเสียสละ\n• ความเคารพต่อผู้อื่น\n• ความรักความสงบ'
        }
      ]
    },
    {
      id: 'communication',
      title: 'การสื่อสารและประสานงาน',
      icon: MessageCircle,
      content: [
        {
          title: 'การสื่อสารกับลูกเสือ',
          description: '• ใช้ภาษาที่เข้าใจง่าย\n• ฟังความคิดเห็นของเด็ก\n• ให้คำแนะนำอย่างชัดเจน\n• สร้างบรรยากาศที่เปิดกว้าง'
        },
        {
          title: 'การสื่อสารกับผู้ปกครอง',
          description: '• แจ้งกำหนดการล่วงหน้า\n• รายงานผลการดำเนินงาน\n• ปรึกษาในกรณีมีปัญหา\n• ขอความร่วมมือในกิจกรรมต่างๆ'
        },
        {
          title: 'การประสานงานกับทีม',
          description: '• ประชุมผู้กำกับหมู่เป็นประจำ\n• รายงานสถานการณ์ให้ผู้กำกับกองทราบ\n• ประสานงานกับผู้จัดกิจกรรม\n• แลกเปลี่ยนความรู้และประสบการณ์'
        }
      ]
    },
    {
      id: 'emergency',
      title: 'การจัดการสถานการณ์ฉุกเฉิน',
      icon: AlertCircle,
      content: [
        {
          title: 'การเตรียมความพร้อม',
          description: '• มีรายชื่อโทรศัพท์ฉุกเฉิน\n• เตรียมกล่องปฐมพยาบาล\n• ฝึกซ้อมแผนการรับมือฉุกเฉิน\n• ทราบที่ตั้งโรงพยาบาลใกล้เคียง'
        },
        {
          title: 'ขั้นตอนเมื่อเกิดเหตุฉุกเฉิน',
          description: '1. รักษาความสงบและปลอดภัยเป็นลำดับแรก\n2. ประเมินสถานการณ์และให้ความช่วยเหลือเบื้องต้น\n3. แจ้งผู้บังคับบัญชาทันที\n4. ติดต่อผู้ปกครองหรือญาติ\n5. บันทึกเหตุการณ์และรายงาน'
        },
        {
          title: 'สถานการณ์ฉุกเฉินที่พบบ่อย',
          description: '• ลูกเสือหายตัว\n• บาดเจ็บและอุบัติเหตุ\n• ภาวะแพ้และโรคฉับพลัน\n• สภาพอากาศที่รุนแรง\n• สัตว์ร้ายหรืออันตราย'
        }
      ]
    },
    {
      id: 'tips',
      title: 'เคล็ดลับและข้อแนะนำ',
      icon: BookOpen,
      content: [
        {
          title: 'เคล็ดลับการเป็นผู้กำกับหมู่ที่ดี',
          description: '• เรียนรู้จากประสบการณ์อย่างต่อเนื่อง\n• พัฒนาตนเองและเรียนรู้สิ่งใหม่ๆ\n• สร้างเครือข่ายกับผู้กำกับคนอื่น\n• มีความอดทนและไม่ยอมแพ้\n• จดบันทึกสิ่งที่เรียนรู้ได้'
        },
        {
          title: 'การจัดการเวลา',
          description: '• วางแผนกิจกรรมล่วงหน้า\n• แบ่งงานและมอบหมายความรับผิดชอบ\n• ใช้ปฏิทินและเครื่องมือช่วย\n• จัดลำดับความสำคัญของงาน'
        },
        {
          title: 'การดูแลตนเอง',
          description: '• พักผ่อนให้เพียงพอ\n• ดูแลสุขภาพร่างกายและจิตใจ\n• ขอความช่วยเหลือเมื่อจำเป็น\n• มีงานอดิเรกและพักผ่อนหย่อนใจ'
        }
      ]
    }
  ];

  return (
    <div className="page">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-scout-100 dark:bg-scout-800 flex items-center justify-center">
            <BookOpen className="text-scout-700 dark:text-scout-300" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-scout-900 dark:text-white">คู่มือผู้กำกับหมู่</h1>
            <p className="text-sm text-gray-400">แนะนำการใช้งานสำหรับผู้กำกับหมู่ลูกเสือ</p>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="card p-4 text-center">
          <Users className="text-scout-600 dark:text-scout-400 mx-auto mb-2" size={24} />
          <p className="text-sm font-semibold text-scout-900 dark:text-white">บทบาทหน้าที่</p>
          <p className="text-xs text-gray-400">ความรับผิดชอบหลัก</p>
        </div>
        <div className="card p-4 text-center">
          <Shield className="text-green-600 dark:text-green-400 mx-auto mb-2" size={24} />
          <p className="text-sm font-semibold text-scout-900 dark:text-white">ความปลอดภัย</p>
          <p className="text-xs text-gray-400">การดูแลลูกเสือ</p>
        </div>
      </div>

      {/* Guide Sections */}
      <div className="space-y-4">
        {guideSections.map((section) => {
          const Icon = section.icon;
          const isExpanded = expandedSection === section.id;
          
          return (
            <div key={section.id} className="card">
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-scout-800 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-scout-100 dark:bg-scout-800 flex items-center justify-center">
                    <Icon className="text-scout-600 dark:text-scout-400" size={20} />
                  </div>
                  <h3 className="text-base font-semibold text-scout-900 dark:text-white">
                    {section.title}
                  </h3>
                </div>
                {isExpanded ? (
                  <ChevronUp className="text-gray-400" size={20} />
                ) : (
                  <ChevronDown className="text-gray-400" size={20} />
                )}
              </button>
              
              {isExpanded && (
                <div className="px-4 pb-4 space-y-4">
                  {section.content.map((item, index) => (
                    <div key={index} className="border-l-2 border-scout-200 dark:border-scout-700 pl-4">
                      <h4 className="text-sm font-semibold text-scout-800 dark:text-scout-200 mb-2">
                        {item.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Contact Help */}
      <div className="card mt-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3 p-4">
          <HelpCircle className="text-blue-600 dark:text-blue-400 mt-1" size={20} />
          <div>
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-1">
              ต้องการความช่วยเหลือเพิ่มเติม?
            </h3>
            <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">
              หากมีข้อสงสัยหรือต้องการคำแนะนำเพิ่มเติม สามารถติดต่อได้ที่:
            </p>
            <div className="space-y-1">
              <p className="text-xs text-blue-600 dark:text-blue-400">
                • ผู้กำกับกอง: สอบถามปัญหาในการดำเนินงาน
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                • ผู้จัดกิจกรรม: ปรึกษาเรื่องกิจกรรมและสถานที่
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                • ผู้ดูแลค่าย: ปัญหาด้านสถานที่และอุปกรณ์
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
