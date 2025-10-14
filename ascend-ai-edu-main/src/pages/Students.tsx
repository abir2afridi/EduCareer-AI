import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, UserPlus, Filter } from "lucide-react";

const students = [
  { id: 1, name: "Sarah Johnson", email: "sarah.j@edu.com", course: "Data Science", gpa: 3.8, status: "Active" },
  { id: 2, name: "Michael Chen", email: "michael.c@edu.com", course: "AI Engineering", gpa: 3.9, status: "Active" },
  { id: 3, name: "Emma Davis", email: "emma.d@edu.com", course: "Web Development", gpa: 3.7, status: "Active" },
  { id: 4, name: "James Wilson", email: "james.w@edu.com", course: "Cyber Security", gpa: 3.6, status: "Active" },
];

export default function Students() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold gradient-text">Student Management</h2>
          <p className="text-muted-foreground mt-1">Manage and track student progress</p>
        </div>
        <Button className="bg-gradient-primary hover:opacity-90">
          <UserPlus className="h-4 w-4 mr-2" />
          Add Student
        </Button>
      </div>

      <Card className="glass p-6">
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              className="pl-10 bg-input border-border/50"
            />
          </div>
          <Button variant="outline" className="border-border/50">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left p-4 font-semibold">Name</th>
                <th className="text-left p-4 font-semibold">Email</th>
                <th className="text-left p-4 font-semibold">Course</th>
                <th className="text-left p-4 font-semibold">GPA</th>
                <th className="text-left p-4 font-semibold">Status</th>
                <th className="text-left p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr
                  key={student.id}
                  className="border-b border-border/30 hover:bg-muted/30 transition-colors"
                >
                  <td className="p-4 font-medium">{student.name}</td>
                  <td className="p-4 text-muted-foreground">{student.email}</td>
                  <td className="p-4">{student.course}</td>
                  <td className="p-4">
                    <span className="px-3 py-1 rounded-full bg-primary/20 text-primary font-semibold">
                      {student.gpa}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="px-3 py-1 rounded-full bg-accent/20 text-accent text-sm">
                      {student.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <Button variant="ghost" size="sm">View Details</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
